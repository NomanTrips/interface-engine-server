'use strict';

exports.scheduleListener = function (interval, units, listener, sender) {
    var intervalMultiplier;
    switch (units) {
        case 'milliseconds':
            intervalMultiplier = 1;
            break;
        case 'seconds':
            intervalMultiplier = 1000;
            break;
        case 'minutes':
            intervalMultiplier = 60000;
            break;
        case 'hours':
            intervalMultiplier = 3600000; // 3.6e+6
            break;
        case 'days':
            intervalMultiplier = 86400000; //8.64e+7
    }

    var intervalInMilliseconds = intervalMultiplier * interval;
    var timer = setInterval(listener, intervalInMilliseconds, [sender]);
};