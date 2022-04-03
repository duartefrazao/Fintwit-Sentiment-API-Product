import logging

import azure.functions as func
from pymongo import MongoClient
import os 
import json
from datetime import date

def main(req: func.HttpRequest) -> func.HttpResponse:
    #TODO REMOVE
    allowedTickers = set(json.load(open('retrievedata/tickers.json'))["tickers"])


    client = MongoClient(os.environ['cosmosConnectionString'])
    records = client.sentiment.records
    dateValue = req.params.get('date')

    if not dateValue:
        return func.HttpResponse(json.dumps({"msg":"Invalid request."}),status_code=400)


    document =records.find_one(filter={'date':dateValue}) 
    
    if not document:
        return func.HttpResponse(json.dumps({"msg":"No record for the specified date."}),status_code=201)
    
    sentiment = round(document['sentiment'],2)
    return func.HttpResponse(json.dumps({"sentiment":sentiment}), status_code=200) 
