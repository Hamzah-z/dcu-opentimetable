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
 * @param {Day}
 * @return {Promise} Object containing classes for the day
 */

const Weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] // Used to fetch the index for a day

// Fetch the date for the start of the current week
function StartOfWeek() {
    date = new Date()

    var DateDifference = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);
  
    FirstDayInWeek = new Date(date.setDate(DateDifference)).toISOString() // Convert our date to ISOString
    return FirstDayInWeek.slice(0, -14).concat("T00:00:00.000Z") // Slice the date and add a time for midnight to the end
    // Should output something like 2019-10-21T00:00:00.000Z
}

// Load the template JSON file to send the post request.
function LoadNewTemplate() {
    let NewTemplate = require('./resources/req-template.json')
    return NewTemplate
}

// Edit the template to modify the current Day name and index
function EditTemplate(template, DayName) {
    FinalDayNumber = Weekdays.indexOf(DayName) + 1
    FinalDayName = DayName

    template['ViewOptions']['Weeks'][0]['FirstDayInWeek'] = StartOfWeek()
    template['ViewOptions']['Days'][0]['Name'] = FinalDayName
    template['ViewOptions']['Days'][0]['DayOfWeek'] = FinalDayNumber
    
    return template
}

// Sort the classes by time (earlier classes first)
function SortByTime(Arr) {
    return new Promise(function(resolve, reject) {
        resolve(Arr.sort((a,b)=> a.Time.slice(0, -3) - b.Time.slice(0, -3)))
    })
}

// Fetch the timetable
function FetchTimetable(Body) {

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
        body: Body,
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
function FetchClassesForDay(Day) {
    return new Promise(function(resolve, reject) {

        FetchTimetable(EditTemplate(LoadNewTemplate(), Day))
        .then(Classes => {
            let TodaysClasses = []

            Response = Classes[0].CategoryEvents
            Response.forEach(Class => { // For each class, create an object containing it's information
                let ThisClass = new Object
                ThisClass.ClassName = Class.Description
                ThisClass.Type = Class.EventType
                ThisClass.Time = Class.StartDateTime.slice(11, -9)
                ThisClass.Location = Class.Location.substring(4)

                TodaysClasses.push(ThisClass) // Add the class's object to the final array
            });
        
            SortByTime(TodaysClasses) // Sort the classes chronologically
            .then(SortedArray => {
                resolve(SortedArray) // Finally resolve the array with today's classes
            })
        })
        .catch(err => { // Catch any errors
            console.log(err)
            reject(err)
        })
    })
}

// Call the function
FetchClassesForDay('Monday')
.then(List => {
    console.log(List)
})
.catch(err => { // Catch any errors
    console.log(err)
})