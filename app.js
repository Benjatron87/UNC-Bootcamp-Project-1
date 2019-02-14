$("#clear-history").hide();
$(document).ready(function() {
    var config = {
        apiKey: "AIzaSyCHf--MzFoBdPYS1zbDOsNR5fsTJxgxdD0",
        authDomain: "stock-search-app.firebaseapp.com",
        databaseURL: "https://stock-search-app.firebaseio.com",
        projectId: "stock-search-app",
        storageBucket: "",
        messagingSenderId: "1075965615373"
    }

      firebase.initializeApp(config);

    let database = firebase.database();
    let date = []
    let stockValue = []
    let history = [];
    let num = 0;

    let popStocks = ['AAPL', 'MSFT', 'FB', 'AMZN', 'GOOG'];

    // Initialize Firebase
    function stock(input){
        var first;
        var last;

        input = input.toUpperCase();

        var queryURL = "https://api.iextrading.com/1.0/stock/market/batch?symbols=" + input + "&types=quote,chart&range=1m&last=5";

        $.ajax({
        url: queryURL,
        method: "GET",
        error: function (error) {
            console.log(error);
        } 
        })//catch the error for when the company name is empty
        .catch(function(response) {
            if (response.status === 400) {
                $("#compCode").html(input+" Missing Company Code");
                $("#compNotFound").show();  
                $(":button").on("click", function(event) {
                    if ($(this).attr("data-dismiss")=='modal'){
                        $("#compNotFound").hide();
                    }
                }); 
                //clear console only when error 400 is found 
                console.clear();
                return;
                
            }else{
                return response;
            }
        })
        .then(function(response){
            if(!response){
                return;
            }
            
            if (response[input]!=undefined ){

                getNews(response[input].quote.companyName, input);


                stockValue = []
                date = []

                var num2 = -1
                var color;
                
                for(var i = 0; i < response[input].chart.length; i++){

                    var close = response[input].chart[i].close

                    close = close.toFixed(2);

                    stockValue.push(close);
                    date.push(response[input].chart[i].date);

                    num2++

                }

                first = stockValue[0];
                last = stockValue[num2];

                var tbody = $("#stockslisted");
                // put this so that it doesn't take up whole line look for other ways around this
                var name = $("<td>").text(response[input].quote.companyName);
                var close = $("<td>").text("$" + stockValue[num2]);
                var canvas = $("<canvas>");
                
                canvas.attr("id", input).hide();

                // appends stock data to the table
                var table = $("<tr>").append(name, close, "<br>").attr("val", input).addClass("chart").attr("value", input).attr('id', input + num)

                    // creates the graph and puts below stocks
                var newRow = $("<tr>").append($("<td>").attr("colspan", 2).append(canvas)) 

                tbody.prepend(table, newRow);

                if (first > last){
                    color = 'rgba(200, 0, 0, 1)'
                    $("#" + input + num).css("color", "red");
                }
                else if(first < last){
                    color = 'rgba(0, 200, 0, 1)'
                    $("#" + input + num).css("color", "green");
                }

                    // below is chartJS it creates the graph
                    var ctx = document.getElementById(input).getContext('2d');
                    myChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: date,

                        datasets: [{
                            label: input,
                            data: stockValue,
                            backgroundColor:[
                                'rgba(0, 0, 0, 0)'
                            ],
                            borderColor: [
                                color
                            ],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        legend: {
                            labels: {
                                fontColor: color
                            }
                        },
                        responsive:true,
                        maintainAspectRatio:true,
                        scales: {
                            yAxes: [{
                                ticks: {
                                    beginAtZero:false
                                }
                            }]
                        }
                    }
                });
                $(document).unbind().on("click", ".chart", function(){
                    
                    var click = $(this).attr("val");

                    $("#" + click).toggle();
            
                });


                num++ 

            }else{
                $("#compCode").html(input+" Not Found");
                $("#compNotFound").show();
                $(":button").on("click", function(event) {
                    if ($(this).attr("data-dismiss")=='modal'){
                        $("#compNotFound").hide();
                    }
                });
            }
        });

    };

    //api calls to get news links for the stock searched         
    function getNews(item, item2){
    
        var URL = 'https://newsapi.org/v2/everything?q=' + item + 's&apiKey=d53b18e6f2bb4408bb4b79dd3dfb406b'
    
        $.ajax({
            url: URL,
            method: "GET"
            })
            .then(function(response){

                console.log(response)

                var tbody = $("#newsArticles");

                var table = $("<tr class="+item2+">")
            
                for(i = 0; i < 5; i++){

                    var newsURL = response.articles[i].url;
                    var title = response.articles[i].title;
                    var dates = response.articles[i].publishedAt.substr(0,10);
                    var author = response.articles[i].author;
                    
                    

                    var newslink = $("<tr>").html('<a href="'+newsURL+'" target="blank">'+title+' (Date: '+dates+') '+'Author: '+author+'</a>');

                    table.append('<br>', newslink).css('font-weight', 'normal');
                        
                };
            
                var article = $("<tr>").text('Click here for latest news for '+item);

                article.attr("val", item2).addClass("newslinks");

                tbody.prepend( "<br>", article);

                article.append(table);

                $('.'+item2).hide();  

                $(".newslinks").unbind().on("click", function(){ 
                    var click1 = "."+$(this).attr("val");
                
                    $(click1).toggle();

                }); 
    
        });
    }

    $(window).on( "load", function() {

        for(var i = 0; i < popStocks.length; i++){

            stock(popStocks[i]);

        }
    });

// when clicking the add-button adds the stock to the stock div
    $("#add-button").on("click", function(event) {
        event.preventDefault()

        var searched = $("#user-input").val().trim();

        searched = searched.toUpperCase();

        var isInArray = popStocks.indexOf(searched);

        console.log(isInArray)

        if (isInArray == -1){
            
            stock(searched)
        }

        // stores this as recent searches in firebase
        database.ref().push({
            searches: $("#user-input").val().trim()
           });
    })
    
    database.ref().on("child_added", function(snapshot) {

        var snapVal = snapshot.val();

        var isPresent = history.indexOf(snapVal.searches);

        if(isPresent == -1){
            history.push(snapVal.searches);
        }

        console.log(history);

        $("#clear-history").on('click', function(){

            database.ref().remove()
            history = [];
            $("#stockslisted").empty();
            $("#newsArticles").empty();

        })
        console.log(history)

    });

    $("#history-button").on('click', function(){
        event.preventDefault()

        $("#stockslisted").empty();
        $("#newsArticles").empty();
        $("#stock").text('Search History:');
        $("#clear-history").show();

        for(var i = 0; 1 < history.length; i++){

            stock(history[i]);
            console.log(history[i])
        }

    })

    $("#home-button").on('click', function(){
        event.preventDefault()
        console.log('hey')

        $("#stockslisted").empty();
        $("#newsArticles").empty();
        $("#stock").text('Stocks:');
        $("#clear-history").hide();

        for(var i = 0; i < popStocks.length; i++){

            stock(popStocks[i]);

        }

    })

    ////Market close/open TIMER
    var tday =moment('16:00', 'HH:mm');
    var minAway=tday.diff(moment(),"s");
    var secAway=minAway*1000;
    var marketStatus="Time Until Market Closes: ";

    var pastMidNight=parseInt((moment().format('HH')));
    var pastMidNightM=parseInt((moment().format('mm')));
    
    //accounting for the midnight time 
    if((pastMidNight<9) || ((pastMidNight==9) && pastMidNightM<=30) ){
        minAway=moment().diff(tday,"s");
    }
    
    if(minAway<0){
        var nextDay=moment().add(1, 'd').format('MM-DD-YYYY');
        var open=moment(nextDay+'9:31', 'MM-DD-YYYY HH:mm')
        var minAway=open.diff(moment(),"s");
        var secAway=minAway*1000;
        var marketStatus="Time Until Market Opens: ";
    }

    //Accounting for weekend
    function dayFinder(dayINeed){
        // if we haven't yet passed the day of the week that I need:
        if (moment().isoWeekday() <= dayINeed) { 
            // then just give me this week's instance of that day
            var dayRequested=moment().isoWeekday(dayINeed);
            return dayRequested;
        } else {
            // otherwise, give me next week's instance of that day
            var dayRequested=moment().add(1, 'weeks').isoWeekday(dayINeed);
            return dayRequested;
        }
    }
        
    var monday=dayFinder(1);
 
    var weekday=moment().weekday();
    
    if( //after 4:00 on friday
        ((weekday>5) || (weekday==5 && ((parseInt(moment().format('HH'))==16) && (parseInt(moment().format('mm'))>0) || (parseInt(moment().format('HH'))>=16))) || (weekday==0)) 
            ||  
        (   (weekday==1) && ((parseInt(moment().format('HH'))<9) || (parseInt(moment().format('HH'))==9 && (parseInt(moment().format('mm')))<25))
        )
    ){  //check if the current date is less than monday
        $("#marketTimer").html("Closed On Weekends Reopens On "+monday.format('MM/DD/YYYY')+" @ 9:30 a.m"); 
    }
    else {//show timer
 
    var countDownQ =new Date().getTime()+secAway;
    var y = setInterval(function() {
    var nowQ = new Date().getTime();
    var distanceQ = countDownQ - nowQ;
    var daysQ = Math.floor(distanceQ / (1000 * 60 * 60 * 24));
    var hoursQ = Math.floor((distanceQ % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutesQ = Math.floor((distanceQ % (1000 * 60 * 60)) / (1000 * 60));
    var secondsQ = Math.floor((distanceQ % (1000 * 60)) / 1000);
    if (minutesQ<9){
        var delim=" : 0";
    }else{
        var delim=" : "; 
    }
    if (hoursQ<9){
        var hdelim=" 0";
    }else{
        var hdelim=" "; 
    }

        if(secondsQ>=0){$("#marketTimer").html(marketStatus+hdelim+hoursQ+' hrs '+delim+minutesQ+' min'); }
        
        if (distanceQ < 0 ) {
            clearInterval(y);
        }
    }, 1000);

    }

    firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // ...
      });

});
