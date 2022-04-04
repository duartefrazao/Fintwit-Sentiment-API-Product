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
    stock  = req.route_params.get('stock').upper()
    account  = req.route_params.get('account')

    if not dateValue or not stock or not account:
        return func.HttpResponse(json.dumps({"msg":"Invalid request."}),status_code=400)


    document =records.find_one(filter={'date':dateValue}) 
    
    if not document:
        return func.HttpResponse(json.dumps({"msg":"No record for the specified date or account."}),status_code=201)
    
    account = document["accountRecords"][account]

    tickers = account["accountTickerSentiment"]
    stock = tickers.get(stock,None)
    
    if not stock:
        return func.HttpResponse(json.dumps({"msg":"Stock not found."}),status_code=201)

    sentiment =  round(stock['sentimentSum']/stock['sentimentCount'],2)

    return func.HttpResponse(json.dumps({"sentiment":sentiment}), status_code=200) 
