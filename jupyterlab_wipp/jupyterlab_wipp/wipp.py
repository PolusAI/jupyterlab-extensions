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

class WippImageCollection():
    def __init__(self, json):
        self.json = json
        
        self.id = self.json['id']
        self.name = self.json['name']
        
    def __repr__(self):
        return f'{self.id}\t{self.name}'

class wipp:

    def __init__(self):
        # WIPP UI URL -- env variable required
        self.wipp_ui_url = os.getenv('WIPP_UI_URL') #i.e. http://wipp-ui.ci.aws.labshare.org/notebooks/

        # Other configurable variables: if no env variable provided, take default value
        self.api_route = os.getenv('WIPP_API_INTERNAL_URL') if "WIPP_API_INTERNAL_URL" in os.environ else 'http://wipp-backend:8080/api'
        self.notebooks_path = os.getenv('WIPP_NOTEBOOKS_PATH') if "WIPP_NOTEBOOKS_PATH" in os.environ else "/opt/shared/wipp/temp/notebooks"

    def register_notebook(self, notebook_path, name, description):
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
            response_json["url"] = self.wipp_ui_url

            result["info"] = response_json
        elif response.status_code == 400:
            result["error"] = response.text
        return result
    
    def get_image_collections_summary(self):
        r = requests.get(os.path.join(self.api_route, 'imagesCollections'))
        if r.status_code==200:
            total_pages = r.json()['page']['totalPages']
            page_size = r.json()['page']['size']
            
            return (total_pages, page_size)

    def get_image_collections_page(self, index):
        r = requests.get(os.path.join(self.api_route, 'imagesCollections', f'?page={index}'))
        if r.status_code==200:
            collections_page = r.json()['_embedded']['imagesCollections']
            return [WippImageCollection(collection) for collection in collections_page]
    
    def get_image_collections_all_pages(self):
        total_pages, _ = self.get_image_collections_summary()
        return [self.get_image_collections_page(page) for page in range(total_pages)]
        

    def get_image_collections(self):
        return [collection.json for collection in sum(self.get_image_collections_all_pages(), [])]
        


        