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

class wipp:

    def register_notebook(self, notebook_path, name, description):
        api_route = 'http://wipp-backend:8080/api/notebooks/'
        notebooks_path = '/opt/shared/wipp/temp/notebooks'
        wipp_ui_url = os.getenv('WIPP_UI_URL') #i.e. http://wipp-ui.ci.aws.labshare.org/notebooks/
        
        #Generate random ObjectID for notebook
        object_id = gen_random_object_id()
        
        #Create destination folder in WIPP
        dest_folder = os.path.join(notebooks_path, object_id)
        if not os.path.exists(dest_folder):
            os.makedirs(dest_folder)

        #Copy notebook to destination folder in WIPP
        dest_path = os.path.join(dest_folder, 'notebook.ipynb')
        shutil.copy(notebook_path, dest_path)

        #Send API request to WIPP to register notebook
        url = api_route + 'import'
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
            response_json["url"] = wipp_ui_url

            result["info"] = response_json
        elif response.status_code == 400:
            result["error"] = response.text
        return result
        
        