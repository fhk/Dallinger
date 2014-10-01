/*
 * Requires:
 *     psiturk.js
 *     utils.js
 */

// Initalize psiturk object
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);

var mycondition = condition;  // these two variables are passed by the psiturk server process
var mycounterbalance = counterbalance;  // they tell you which condition you have been assigned to
// they are not used in the stroop code but may be useful to you

// All pages to be loaded
var pages = [
	"instructions/instruct-ready.html",
	"stage.html",
	"postquestionnaire.html"
];

psiTurk.preloadPages(pages);

var instructionPages = [ // add as a list as many pages as you like
	"instructions/instruct-ready.html"
];


/********************
* HTML manipulation
*
* All HTML files in the templates directory are requested
* from the server when the PsiTurk object is created above. We
* need code to get those pages from the PsiTurk object and
* insert them into the document.
*
********************/

/********************
* STROOP TEST       *
********************/
var StroopExperiment = function() {

	// Load the stage.html snippet into the body of the page
	psiTurk.showPage('stage.html');
	$("#response-form").hide();
	$("#finish-reading").hide();

	baseUrl = "http://0.0.0.0:22362/";

	// Create the agent.
	createAgent = function() {
		reqwest({
		    url: baseUrl + "agents",
		    method: 'post',
		    type: 'json',
		  	success: function (resp) {
		  		agent_uuid = resp.agents.uuid;
		     	getPendingTransmissions(agent_uuid);
		    },
		    error: function (err) {
		    	console.log(err);
		    }
		});
	};

	getPendingTransmissions = function(destination_uuid) {
		reqwest({
		    url: baseUrl + "transmissions?destination_uuid=" + destination_uuid,
		    method: 'get',
		    type: 'json',
		  	success: function (resp) {
		  		info_uuid = resp.transmissions[0].info_uuid;
		     	info = getInfo(info_uuid);
		    },
		    error: function (err) {
		    	console.log(err);
		    }
		});
	};

	getInfo = function(uuid) {
		reqwest({
		    url: baseUrl + "information/" + uuid,
		    method: 'get',
		    type: 'json',
		  	success: function (resp) {
		     	story = resp.contents;
		     	storyHTML = markdown.toHTML(story);
		     	$("#story").html(storyHTML);
		     	$("#finish-reading").show();
		    },
		    error: function (err) {
		    	console.log(err);
		    }
		});
	};

	createAgent();

	$("#finish-reading").click(function() {
		$("#stimulus").hide();
		$("#response-form").show();
	});

	$("#submit-response").click(function() {
		console.log($("#reproduction").val());

		response = encodeURIComponent($("#reproduction").val());

		reqwest({
		    url: baseUrl +
		    	"information?origin_uuid=" + agent_uuid +
		    	"&contents=" + response,
		  	method: 'post',
		  	data: { foo: 'bar', baz: 100 },
		  	success: function (resp) {
		  		console.log("Submitted.");
		      	currentview = new Questionnaire();
		    }
		});

		// psiTurk.recordTrialData({'phase':"TEST", 'response': $("#reproduction").val()});
	});

};

/****************
* Questionnaire *
****************/

var Questionnaire = function() {

	var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

	record_responses = function() {

		psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'submit'});

		$('textarea').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);
		});
		$('select').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);
		});

	};

	prompt_resubmit = function() {
		replaceBody(error_message);
		$("#resubmit").click(resubmit);
	};

	resubmit = function() {
		replaceBody("<h1>Trying to resubmit...</h1>");
		reprompt = setTimeout(prompt_resubmit, 10000);

		psiTurk.saveData({
			success: function() {
			    clearInterval(reprompt);
                psiTurk.computeBonus('compute_bonus', function(){finish()});
			},
			error: prompt_resubmit
		});
	};

	// Load the questionnaire snippet
	psiTurk.showPage('postquestionnaire.html');
	psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'begin'});

	$("#next").click(function () {
	    record_responses();
	    psiTurk.saveData({
            success: function(){
                psiTurk.computeBonus('compute_bonus', function() {
                	psiTurk.completeHIT(); // when finished saving compute bonus, the quit
                });
            },
            error: prompt_resubmit});
	});


};

// Task object to keep track of the current phase
var currentview;

/*******************
 * Run Task
 ******************/
$(window).load( function(){
    psiTurk.doInstructions(
    	instructionPages, // a list of pages you want to display in sequence
    	function() { currentview = new StroopExperiment(); } // what you want to do when you are done with instructions
    );
});
