param(
  [Parameter(Mandatory = $true)]
  [string]$MongoUri,
  [string]$CsvPath = "C:\Users\LOQ\Documents\TH_mobile_app\scripts\data\pharmacy_sales_ml_dataset_perfect_dates .csv",
  [string]$Collection = "sales_raw"
)

Write-Host "Use mongoimport to load raw historical sales data into Atlas."
Write-Host "Example:"
Write-Host "mongoimport --uri `"$MongoUri`" --collection $Collection --type csv --headerline --file `"$CsvPath`""
