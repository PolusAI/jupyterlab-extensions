import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado


class HubSharingSettingsHandler(APIHandler):
    @property
    def hub_sharing_settings(self):
        return self.settings["hub_sharing_settings"]


class HubSharingGetUsersHandler(HubSharingSettingsHandler):
    @tornado.web.authenticated
    def get(self):
        """
        GET request handler, returns list of users and their sharing status
        """
        try:
            response = self.hub_sharing_settings.get_users_status()
            self.finish(json.dumps(response))
        except:
            self.write(500)
    
    @tornado.web.authenticated
    def post(self):
        """
        POST request handler, updates sharing status of users
        Input format:
          {
            [
              {
                'name': <username>,
                'shared': true/false
              },
              ...
            ]
          }
        """

        data = json.loads(self.request.body.decode("utf-8"))
        try:
            self.hub_sharing_settings.set_users_status(data)
            response = self.hub_sharing_settings.get_users_status()
            self.finish(json.dumps(response))
        except:
            self.write_error(500)


def setup_handlers(web_app):
    handlers = [
        ('/jupyterlab-rtc-hub-settings/users', HubSharingGetUsersHandler)
    ]

    base_url = web_app.settings["base_url"]
    handlers = [(url_path_join(base_url, x[0]), x[1]) for x in handlers]

    host_pattern = ".*$"
    web_app.add_handlers(host_pattern, handlers)