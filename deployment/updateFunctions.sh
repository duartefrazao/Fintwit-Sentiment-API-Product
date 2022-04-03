cd api
zip  api   */*.json */*.py *.json requirements.txt 
mv api.zip ..
cd ..
az webapp deployment source config-zip --resource-group api --name api-sentiment --src api.zip