import os
import string
import requests
import escapism


class HubSharingSettings(object):
    """Class for interfacing with JupyterHub sharing groups"""
    def __init__(self):
        """HubSharingSettings class constructor
        """

        self.api_url = os.getenv('JUPYTERHUB_API_URL')
        self.token = os.getenv('JUPYTERHUB_API_TOKEN')
        self.headers = {
            'Authorization': 'token %s' % self.token
        }

        self.me = os.getenv('JUPYTERHUB_USER')
        safe_chars = set(string.ascii_lowercase + string.digits)
        self.safe_username = escapism.escape(self.me, safe=safe_chars).lower()
        self.sharing_group = f'server_sharing_{self.safe_username}'

    def get_me(self):
        return self.me

    def get_sharing_group(self):
        return self.sharing_group

    def get_all_users(self):
        r = requests.get(self.api_url + '/users', headers=self.headers)
        r.raise_for_status()
        
        users = []
        for user in r.json():
            users.append(user['name'])

        return users

    def get_all_to_share(self):
        users = self.get_all_users()
        me = self.get_me()
        users.remove(me)
        
        return users

    def get_users_shared_to(self):
        r = requests.get(self.api_url + '/groups/' + self.sharing_group, headers=self.headers)
        r.raise_for_status()
        
        shared_to_users = []
        for user in r.json()['users']:
            shared_to_users.append(user)
        
        return shared_to_users

    def share_with(self, users):
        r = requests.post(self.api_url + '/groups/' + self.sharing_group + '/users', 
            headers=self.headers,
            json={
                'users': users
            }
        )

        r.raise_for_status()

    def unshare_from(self, users):
        r = requests.delete(self.api_url + '/groups/' + self.sharing_group + '/users',
            headers=self.headers,
            json={
                'users': users
            }
        )

        r.raise_for_status()
    
    def get_users_status(self):
        all_to_share = self.get_all_to_share()
        shared_to_users = self.get_users_shared_to()

        result = []
        for user in all_to_share:
            if user in shared_to_users:
                result.append({
                    'name': user,
                    'shared': True
                })
            else:
                result.append({
                    'name': user,
                    'shared': False
                })
        
        return result
    
    def set_users_status(self, data):
        add_users = []
        remove_users = []
        shared_to_users = self.get_users_shared_to()

        for user in data:
            if (user['shared'] == True) and (user['name'] not in shared_to_users):
                add_users.append(user['name'])
            elif (user['shared'] == False) and (user['name'] in shared_to_users):
                remove_users.append(user['name'])
        
        self.share_with(add_users)
        self.unshare_from(remove_users)