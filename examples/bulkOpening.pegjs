// Sample submited by Ahryman40k

BulkOpening "bulk_opening" = BulkStartKey _ clientId:Integer _ date:Date _ hour:Hour _ bulkId:Integer _ financialYear:Integer _ period:Integer _ appVersion:StrangeKey {
 const d = new Date(date);
 const h = new Date(hour);
 
 d.setHours( h.getHours() ) 
 d.setMinutes( h.getMinutes() )
 d.setSeconds( h.getSeconds() )
 
 return  {
    type: 'BulkHeader',
    clientId,
    bulkId,
    date: d,
    financialYear,
    period,
    appVersion
  }
}

BulkStartKey = "0000"

Date "date"  = $([0-9]+) { 
    const date = text();
    return Date.parse(date.slice(0, 4) + "-" + date.slice(4, 6) + "-" + date.slice(6, 8));
}

Hour "hour"  = $([0-9]+) { 
    const h = text();
    return new Date().setHours( +h.slice(0,2), +h.slice(2,4), +h.slice(4,6));
}

StrangeKey "id"  = ([0-9][0-9].[0-9][0-9].[0-9][0-9].[0-9][0-9]) { 
    return text(); 
}

Integer "integer"  = [0-9]+ { 
    return parseInt(text(), 10); 
}

_ "whitespace" = [ \t\n\r]*