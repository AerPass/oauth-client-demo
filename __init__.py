import json
import os

_config_file = os.path.join(os.path.dirname(__file__), 'config.json')
config = json.load(open(_config_file))
