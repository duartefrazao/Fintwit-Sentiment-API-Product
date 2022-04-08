import logging

import azure.functions as func
from pymongo import MongoClient
import os 
import json
from datetime import date

def main(req: func.HttpRequest) -> func.HttpResponse:

    client = MongoClient(os.environ['cosmosConnectionString'])
    records = client.sentiment.records
    dateValue = req.params.get('date')
    account  = req.route_params.get('account')

    if not dateValue or not account:
        return func.HttpResponse(json.dumps({"msg":"Invalid request."}),status_code=400)


    document =records.find_one(filter={'date':dateValue}) 
    
    if not document or not document["accountRecords"].get(account,None):
        return func.HttpResponse(json.dumps({"msg":"No record for the specified date or account."}),status_code=201)
    
    account = document["accountRecords"][account]
    sentiment = round(account['accountSentimentSum']/account['accountSentimentCount'],2)

    return func.HttpResponse(json.dumps({"sentiment":sentiment}), status_code=200) 
