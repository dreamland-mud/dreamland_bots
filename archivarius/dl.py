import json

dl_token = '941ed1b0-a6f5-11eb-bcbc-0242ac130002'

def endpoint(cmd):
    return 'https://dreamland.rocks/test-api/' + cmd

def payload(author, msg):
    param_dict = {"args": {"id": author, "message": msg}, "token": dl_token, "bottype": "telegram"}
    return json.dumps(param_dict)

def command(text):
    commands=['typo', 'bug', 'idea', 'nohelp']
    for cmd in commands:
        if (text[1:].startswith(cmd)):
            return cmd

    return ''
