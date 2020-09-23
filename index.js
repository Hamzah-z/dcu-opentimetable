const Request = require('request-promise')

/**
 * This script sends a POST request to the opentimetable endpoint to fetch classes
 * Then stores relevant info for each class in an object, and finally stores each object in one array and resolves it
 * 
 * NOTE: If you want to fetch just the entire response, just call
 * FetchTimetable(EditTemplate(LoadNewTemplate(), 'NameOfDay'))
 * 
 * If you want a chronologically sorted array of a given day's lectures, call 
 * FetchClassesForDay('NameOfDay')
 * 
 * @author Hamzah
 * 
*/

//

const Weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] // Used to fetch the index for a day

const CourseCategoryIdentities = {
    'CA1': '3b57818e-d34a-fe27-62d7-76ab6d97d1af',
    'CASE2': '38b55ac0-a242-23d3-4a10-79f11bdd780c',
    'CASE3': 'ac1c8470-e74f-5239-c153-ccc42c836613',
    'CASE4': '3e2d4f8b-bdb3-5be5-de32-f63308109633',
}

//

function StartOfWeek(DateToFetch) {
    var CurrentDate = DateToFetch
    var DateDifference = CurrentDate.getDate() - CurrentDate.getDay() + (CurrentDate.getDay() === 0 ? -6 : 1);
  
    FirstDayInWeek = new Date(CurrentDate.setDate(DateDifference)).toISOString() // Convert our date to ISOString
    return FirstDayInWeek.slice(0, -14).concat("T00:00:00.000Z") // Slice the date and add a time for midnight to the end
    // Outputs: YYYY-MM-DDT00:00:00.000Z
}

function ConstructRequestBody(CourseCode, Day, DateToFetch) {
    let RequestBodyTemplate = require('./templates/body.json')

    FinalDayNumber = Weekdays.indexOf(Day) + 1

    RequestBodyTemplate['ViewOptions']['Weeks'][0]['FirstDayInWeek'] = StartOfWeek(DateToFetch)
    RequestBodyTemplate['ViewOptions']['Days'][0]['Name'] = Day
    RequestBodyTemplate['ViewOptions']['Days'][0]['DayOfWeek'] = Weekdays.indexOf(Day) + 1
    
    RequestBodyTemplate['CategoryIdentities'][0] = CourseCategoryIdentities[CourseCode]

    return RequestBodyTemplate
}

function FetchRawTimetableData(CourseCode, Day, DateToFetch = new Date()) {

    const ReqHeaders = {
        "Authorization": "basic T64Mdy7m[",
        "Content-Type" : "application/json; charset=utf-8",
        "credentials": "include",
        "Referer" : "https://opentimetable.dcu.ie/",
        "Origin" : "https://opentimetable.dcu.ie/"
    }

    var ReqPayload = {
        method: 'POST',
        uri: 'https://opentimetable.dcu.ie/broker/api/categoryTypes/241e4d36-60e0-49f8-b27e-99416745d98d/categories/events/filter',
        headers: ReqHeaders,
        body: ConstructRequestBody(CourseCode, Day, DateToFetch),
        json: true
    };

    return new Promise(function(resolve, reject) {
        Request(ReqPayload) // Send the HTTP Request
            .then(function(res_body) {
                resolve(res_body)
            })
            .catch(function (err) { // Catch any errors
                reject(err)
            });
    })
}

module.exports = {
    FetchTimetable: FetchRawTimetableData
}