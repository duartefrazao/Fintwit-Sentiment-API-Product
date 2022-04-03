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
    stock  = req.route_params.get('stock')

    if not dateValue or not stock :
        return func.HttpResponse(json.dumps({"msg":"Invalid request."}),status_code=400)


    document =records.find_one(filter={'date':dateValue}) 
    
    if not document:
        return func.HttpResponse(json.dumps({"msg":"No record for the specified date or account."}),status_code=201)
    
    tickers = document["tickersRecords"]
    stockObj = tickers.get(stock,None)    
    if not stockObj:
        return func.HttpResponse(json.dumps({"msg":"Stock not found."}),status_code=201)

    sentiment = round(stockObj['sentimentSum']/stockObj['sentimentCount'],2)


    return func.HttpResponse(json.dumps({"sentiment":sentiment}), status_code=200) 
