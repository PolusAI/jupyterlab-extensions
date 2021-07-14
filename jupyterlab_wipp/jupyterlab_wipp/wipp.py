"""
Module for registering Jupyter notebooks in WIPP based on post request from handlers
"""
import os
import shutil
import sys
import time
import binascii
import requests

import json

def gen_random_object_id():
    """
    Generate random ObjectID in MongoDB format
    """
    timestamp = '{0:x}'.format(int(time.time()))
    rest = binascii.b2a_hex(os.urandom(8)).decode('ascii')
    return timestamp + rest

class WippCollection():
    """Class for holding generic WIPP Collection"""
    
    def __init__(self, json):
        self.json = json
        
        self.id = self.json['id']
        self.name = self.json['name']
        
    def __repr__(self):
        return f'{self.id}\t{self.name}'

class Wipp:
    """Class for interfacing with WIPP API"""
    def __init__(self):
        """Wipp class constructor

        Constructor does not take any arguments directly, but rather reads them from environment variables
        """
        # WIPP UI URL -- env variable required
        self.wipp_ui_url = os.getenv('WIPP_UI_URL') if "WIPP_UI_URL" in os.environ else ''
        self.notebooks_ui_url = os.path.join(self.wipp_ui_url, 'notebooks/')
        self.imagescollections_ui_url = os.path.join(self.wipp_ui_url, 'images-collections/')
        self.imagescollection_ui_url = os.path.join(self.wipp_ui_url, 'images-collection/')
        self.csvcollections_ui_url = os.path.join(self.wipp_ui_url, 'csv-collections/')

        # Other configurable variables: if no env variable provided, take default value
        self.api_route = os.getenv('WIPP_API_INTERNAL_URL') if "WIPP_API_INTERNAL_URL" in os.environ else 'http://wipp-backend:8080/api'
        self.notebooks_path = os.getenv('WIPP_NOTEBOOKS_PATH') if "WIPP_NOTEBOOKS_PATH" in os.environ else "/opt/shared/wipp/temp/notebooks"

    def check_api_is_live(self):
        try:
            r = requests.get(self.api_route, timeout=1)
        except:
            return {"code": 500, "data": "WIPP API is not available, so JupyterLab-WIPP extension will not be loaded"}
        
        if r.status_code==200:
            if '_links' in r.json():
                return {"code": 200, "data": "JupyterLab-WIPP extension is loaded"}
        
        

    def register_notebook(self, notebook_path, name, description):
        """Register Notebook in WIPP

        Keyword arguments:
        notebook_path -- path to Notebook file relative to HOME (usually returned by JupyterLab context menu)
        name -- string with Notebook display name
        description -- string with short description of what the Notebook does
        """

        notebooks_api_route = os.path.join(self.api_route, 'notebooks')
        notebook_path = os.path.join(os.environ['HOME'], notebook_path) #append default path

        #Generate random ObjectID for notebook
        object_id = gen_random_object_id()
        
        #Create destination folder in WIPP
        dest_folder = os.path.join(self.notebooks_path, object_id)
        if not os.path.exists(dest_folder):
            os.makedirs(dest_folder)

        #Copy notebook to destination folder in WIPP
        dest_path = os.path.join(dest_folder, 'notebook.ipynb')
        shutil.copy(notebook_path, dest_path)

        #Send API request to WIPP to register notebook
        url = os.path.join(notebooks_api_route, 'import')
        querystring = {
           "folderName":object_id,
           "name":name,
           "description":description
        }
        response = requests.request("POST", url, params=querystring)

        result = {"code": response.status_code}
        if response.status_code == 200:
            response_json = response.json()
            
            #Append workflow URL information
            response_json["url"] = self.notebooks_ui_url

            result["info"] = response_json
        elif response.status_code == 400:
            result["error"] = response.text
        return result
    
    def get_image_collections_summary(self):
        """Get tuple with WIPP's Image Collections number of pages and page size"""

        r = requests.get(os.path.join(self.api_route, 'imagesCollections'))
        if r.status_code==200:
            total_pages = r.json()['page']['totalPages']
            page_size = r.json()['page']['size']
            
            return (total_pages, page_size)

    def get_image_collections_page(self, index):
        """Get the page of WIPP Image Collections
        
        Keyword arguments:
        index -- page index starting from 0
        """
        r = requests.get(os.path.join(self.api_route, f'imagesCollections?page={index}'))
        if r.status_code==200:
            collections_page = r.json()['_embedded']['imagesCollections']
            return [WippCollection(collection) for collection in collections_page]
    
    def get_image_collections_all_pages(self):
        """Get list of all pages of WIPP Image Collections"""
        total_pages, _ = self.get_image_collections_summary()
        return [self.get_image_collections_page(page) for page in range(total_pages)]
        

    def get_image_collections(self):
        """Get list of all available WIPP Image Collection in JSON format"""
        return [collection.json for collection in sum(self.get_image_collections_all_pages(), [])]

    def search_image_collections_summary(self, name):
        """Get tuple with number of pages and page size of WIPP Image Collections that contain search string in the name
        
        Keyword arguments:
        name -- string to search in Image Collection names
        """
        r = requests.get(os.path.join(self.api_route, f'imagesCollections/search/findByNameContainingIgnoreCase?name={name}'))
        if r.status_code==200:
            total_pages = r.json()['page']['totalPages']
            page_size = r.json()['page']['size']
            
            return (total_pages, page_size)
    
    def search_image_collection_page(self, name, index):
        """Get the page of WIPP Image Collection search

        Keyword arguments:
        name -- string to search in Image Collection names
        index -- page index starting from 0
        """
        r = requests.get(os.path.join(self.api_route, f'imagesCollections/search/findByNameContainingIgnoreCase?name={name}&page={index}'))
        if r.status_code==200:
            collections_page = r.json()['_embedded']['imagesCollections']
            return [WippCollection(collection) for collection in collections_page]

    def search_image_collections_all_pages(self, name):
        """Get list of all pages of WIPP Image Collections search
        
        Keyword arguments:
        name -- string to search in Csv Collection names
        """
        total_pages, _ = self.search_image_collections_summary(name)
        return [self.search_image_collection_page(name, page) for page in range(total_pages)]

    def search_image_collections(self, name):
        """Get list of all found WIPP Image Collection in JSON format
        
        Keyword arguments:
        name -- string to search in Csv Collection names
        """
        return [collection.json for collection in sum(self.search_image_collections_all_pages(name), [])]

    def get_csv_collections_summary(self):
        """Get tuple with WIPP's Csv Collections number of pages and page size"""
        r = requests.get(os.path.join(self.api_route, 'csvCollections'))
        if r.status_code==200:
            total_pages = r.json()['page']['totalPages']
            page_size = r.json()['page']['size']
            
            return (total_pages, page_size)
    
    def get_csv_collections_page(self, index):
        """Get the page of WIPP Csv Collections
        
        Keyword arguments:
        index -- page index starting from 0
        """
        r = requests.get(os.path.join(self.api_route, f'csvCollections?page={index}'))
        if r.status_code==200:
            collections_page = r.json()['_embedded']['csvCollections']
            return [WippCollection(collection) for collection in collections_page]

    def get_csv_collections_all_pages(self):
        """Get list of all pages of WIPP Csv Collections"""
        total_pages, _ = self.get_csv_collections_summary()
        return [self.get_csv_collections_page(page) for page in range(total_pages)]
        
    def get_csv_collections(self):
        """Get list of all available WIPP Csv Collection in JSON format"""
        return [collection.json for collection in sum(self.get_csv_collections_all_pages(), [])]

    def search_csv_collections_summary(self, name):
        """Get tuple with number of pages and page size of WIPP Csv Collections that contain search string in the name
        
        Keyword arguments:
        name -- string to search in Csv Collection names
        """
        r = requests.get(os.path.join(self.api_route, f'csvCollections/search/findByNameContainingIgnoreCase?name={name}'))
        if r.status_code==200:
            total_pages = r.json()['page']['totalPages']
            page_size = r.json()['page']['size']
            
            return (total_pages, page_size)

    def search_csv_collection_page(self, name, index):
        """Get the page of WIPP Csv Collection search
        
        Keyword arguments:
        name -- string to search in Csv Collection names
        index -- page index starting from 0
        """
        r = requests.get(os.path.join(self.api_route, f'csvCollections/search/findByNameContainingIgnoreCase?name={name}&page={index}'))
        if r.status_code==200:
            collections_page = r.json()['_embedded']['csvCollections']
            return [WippCollection(collection) for collection in collections_page]

    def search_csv_collections_all_pages(self, name):
        """Get list of all pages of WIPP Csv Collections search
        
        Keyword arguments:
        name -- string to search in Csv Collection names
        """
        total_pages, _ = self.search_csv_collections_summary(name)
        return [self.search_csv_collection_page(name, page) for page in range(total_pages)]

    def search_csv_collections(self, name):
        """Get list of all found WIPP Csv Collection in JSON format
        
        Keyword arguments:
        name -- string to search in Csv Collection names
        """
        return [collection.json for collection in sum(self.search_csv_collections_all_pages(name), [])]
