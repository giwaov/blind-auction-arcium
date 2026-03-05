import opengradient as og
import json

config = json.load(open("/home/giwa/.opengradient_config.json"))
c = og.Client(private_key=config["private_key"])
print("Client methods:")
print([m for m in dir(c) if not m.startswith('_')])
