from importlib.resources import path
import azure.functions as func
import os
import tweepy
from datetime import datetime, date, time, timedelta
from azure.core.credentials import AzureKeyCredential
from azure.ai.textanalytics import TextAnalyticsClient
import pymongo
import math
import json

MAX_NUM_TWEETS = 10  # 20
MAX_NUM_REPLIES = 10  # 100
MAX_ANALYSED_TWEETS = 2 #5
MAX_ANALYSED_REPLIES = 2 #3

allowedTickers = set(json.load(open('retrievedata/tickers.json'))["tickers"])
endpoint = os.environ['cognitiveServicesEndpoint']
key = os.environ['cognitiveServicesKey']
text_analytics_client = TextAnalyticsClient(
    endpoint=endpoint, credential=AzureKeyCredential(key))
client = tweepy.Client(bearer_token= os.environ['twitterToken'])
NUM_DAYS = 4


def getIntervals(days):
    today = date.today()
    fromDate = (today-timedelta(days=days))
    toDate = (today-timedelta(days=days-1))

    startTime = datetime.combine(fromDate, time())
    endTime = datetime.combine(toDate, time())

    return startTime, endTime


def findTickers(text):
    maxTickerSize = 4
    foundTickers = []
    for i, c in enumerate(text):
        if c == '$':
            tickerSize = 1 + i
            ticker = []
            while (tickerSize - i <= maxTickerSize and text[tickerSize].isalpha()):
                ticker.append(text[tickerSize])
                tickerSize += 1

            if len(ticker) > 0:
                foundTickers.append("".join(ticker))

    foundTickerSet = set(foundTickers)
    allowedTickersSet = set(allowedTickers)
    intersection = list(foundTickerSet.intersection(allowedTickersSet))

    return intersection


def getTweets(account):
    query = 'from:' + account + ' -is:retweet -is:reply'
    startTime, endTime = getIntervals(NUM_DAYS)

    tweets = client.search_recent_tweets(
        query=query,
        tweet_fields=['context_annotations', 'created_at'],
        max_results=MAX_NUM_TWEETS,
        start_time=startTime,
        end_time=endTime).data
    return (tweets or [])


def getReplies(id, account):
    query = 'conversation_id:{} to:{} -is:retweet is:reply'.format(id, account)

    replies = client.search_recent_tweets(
        query=query,
        tweet_fields=['created_at', 'conversation_id'],
        max_results=MAX_NUM_TWEETS).data

    return (replies or [])


def sentimentAnalysis(text):
    sentimentScore = 0
    sentiment = "neutral"

    result = text_analytics_client.analyze_sentiment(
        [text], show_opinion_mining=False)[0]

    if not result.is_error:
        sentiment = result.sentiment
        sentimentScore = result.confidence_scores.positive - \
            result.confidence_scores.negative

    return sentiment,sentimentScore

def tickerHandler(info, infoAccount, text,sentimentScore):
    for ticker in findTickers(text):
        tickerObj = infoAccount["accountTickerSentiment"].get(ticker,None)
        print("Found ticker ",ticker)
        print(text)

        if not tickerObj:
            print("Creating")
            infoAccount["accountTickerSentiment"][ticker] = {
                "sentimentSum":0,
                "sentimentCount":0
            }

        infoAccount["accountTickerSentiment"][ticker]["sentimentSum"] += sentimentScore
        infoAccount["accountTickerSentiment"][ticker]["sentimentCount"] += 1

        tickerObjTotal = info["tickersRecords"].get(ticker,None)

        if not tickerObjTotal:
            info["tickersRecords"][ticker] = {
                "postsContainingTicker":0,
                "sentimentSum":0,
                "sentimentCount":0
            }
        info["tickersRecords"][ticker]["postsContainingTicker"]+=1
        info["tickersRecords"][ticker]["sentimentSum"] += sentimentScore
        info["tickersRecords"][ticker]["sentimentCount"] += 1



def updateTotalSentiment(sentiment, sentimentScore, info, post):
    if (sentiment == "positive"):
        info["positiveTweets"]+=1
    elif (sentiment == "mixed"):
        info["mixedTweets"]+=1
    elif (sentiment == "neutral"):
        info["neutralTweets"]+=1
    elif (sentiment == "negative"):
        info["negativeTweets"]+=1

    info["sentiment"]+=sentimentScore
    info["sentimentCount"]+=1
    if post:
        info["sentimentPosts"]+=sentimentScore
        info["sentimentPostsCount"]+=1
    else:
        info["sentimentReplies"]+=sentimentScore
        info["sentimentRepliesCount"]+=1

    return 




def processTweet(info,infoAccount, tweet,tweetIndex, account):

    if tweetIndex < MAX_ANALYSED_TWEETS:
        sentiment,sentimentScore = sentimentAnalysis(tweet.text)
        updateTotalSentiment(sentiment,sentimentScore,info, True)

        infoAccount["accountSentimentSum"]+=sentimentScore
        infoAccount["accountSentimentCount"]+=1
        tickerHandler(info,infoAccount,tweet.text,sentimentScore)
    
    replies = getReplies(tweet.id, account)
    infoAccount["numberRepliesTotal"]+=len(replies)

    for replyIndex, reply in enumerate(replies):
        if tweetIndex < MAX_ANALYSED_TWEETS and replyIndex < MAX_ANALYSED_REPLIES:
            sentiment,sentimentScore = sentimentAnalysis(reply.text.upper())
            updateTotalSentiment(sentiment,sentimentScore,info, False)


            infoAccount["repliesSentimentSum"] += sentimentScore
            infoAccount["repliesSentimentCount"] += 1 

    info["numTweetsAnalysed"] += 1 + len(replies)
    return 

def sample_analyze_sentiment():
    accounts = ['optionsgeneral', 'MacroAlf', 'markminervini', 'realMeetKevin', 'BigBullCap',
                'Mayhem4Markets', 'gurgavin', 'cperruna', 'LiviamCapital', 'saxena_puru', 'JonahLupton']
    accounts = ['Mayhem4Markets', 'gurgavin']

    today = date.today()
    recordDate = str(today-timedelta(days=NUM_DAYS))
    
    info = {
        "_id": recordDate,
        "date": recordDate,
        "sentiment": 0,
        "sentimentCount": 0,
        "sentimentPosts": 0,
        "sentimentPostsCount": 0,
        "sentimentReplies": 0,
        "sentimentRepliesCount": 0,
        "positiveTweets": 0,
        "negativeTweets": 0,
        "neutralTweets": 0,
        "mixedTweets":0,
        "numTweetsAnalysed": 0,
        "numberReplies": 0,
        "numberPosts": 0,
        "accountRecords": {},
        "tickersRecords": {}
    }

    for account in accounts:

        tweets = getTweets(account)

        infoAccount={
            "accountSentimentSum": 0,
            "accountSentimentCount": 0,

            "numberRepliesTotal": 0,
            "numberPosts": len(tweets),
            
            "repliesSentimentSum": 0,
            "repliesSentimentCount": 0,
            
            "accountTickerSentiment": {
            },
        }
        
        for tweetIndex, tweet in enumerate(tweets[0:2]):
            tweet.text=tweet.text.upper()
            processTweet(info,infoAccount, tweet, tweetIndex,account)
        info["accountRecords"][account]= infoAccount
    cosmos(info)
    return 

def cosmos(info):
    connectionString = os.environ['cosmosConnectionString']
    client = pymongo.MongoClient(connectionString)
    records = client.sentiment.records
    records.delete_many({"date":info["date"]})
    records.insert_one(info)



def main(mytimer: func.TimerRequest) -> None:
    sample_analyze_sentiment()

    
