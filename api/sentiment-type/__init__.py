import logging

import azure.functions as func
from pymongo import MongoClient
import os 
import json
from datetime import date

def main(req: func.HttpRequest) -> func.HttpResponse:

    client = MongoClient(os.environ['connectionString'])
    records = client.records.records
    dateValue = req.params.get('date')
    type  = req.route_params.get('type')
    validTypes = {'positive','negative','neutral','mixed'}

    if not dateValue or not type or type not in validTypes:
        return func.HttpResponse(json.dumps({"msg":"Invalid request."}),status_code=400)


    document =records.find_one(filter={'date':dateValue}) 
    
    if not document:
        return func.HttpResponse(json.dumps({"msg":"No record for the specified date."}),status_code=201)
    
    sentimentCount = 0
    if (type == 'positive') :
        sentimentCount=document['positiveTweets']
    elif (type == 'negative') :
        sentimentCount=document['negativeTweets']
    elif (type == 'mixed'):
        sentimentCount=document['mixedTweets']
    elif (type == 'neutral'):
        sentimentCount=document['neutralTweets']    

    return func.HttpResponse(json.dumps({"count":sentimentCount}), status_code=200) 
