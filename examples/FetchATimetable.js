let OpenTimetable = require('../index.js')

OpenTimetable.FetchTimetable('CASE2', 'Monday', new Date(2020, 10, 5))
.then(Data => {
    console.log(Data)
})
.catch(err => {
    console.log(err)
})