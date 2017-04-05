$(document).ready(function(){

//OBJECTS GLOBAL VARS AND LISTENERS//

	var GameSession = function(){
		this.moves = []; //holds the moves sequence
		this.level = 0;
		this.strict = null;	
		this.replaySpeed = 1; //the speed at which the sequence will be reproduced
		this.blinkDur = 0.5; //the speed at which each single move will be shown
		this.rotate = false;
		this.currRotation = 0;

		//adds one move to the sequence, a number 1-4 representing the id of a pad
		this.addMove = function(){
			var newMove = Math.floor(Math.random() * (5 - 1) + 1);
			this.moves.push(newMove);
		}; 

		this.nextLevel = function(){
			this.level++;
			this.replaySpeed = Math.min(5, this.replaySpeed + 0.15);
			this.blinkDur = Math.max(0.2, this.blinkDur - 0.015);
			this.addMove();
			this.rotate = this.level >= 15; //rotation's on from level 15
		};

		this.init = function(level, strict){
			for(var i=0; i < level; i++)
				this.nextLevel();

			this.strict = strict;
		};
	};

	var Turn = function(numberOfMoves){
		this.movesLeft = numberOfMoves;
		this.movesIdx = 0; //index to identify the current move to perform in the sequence array

		this.nextMove = function(){
			this.movesLeft--;
			this.movesIdx++;
		};
	};

	var currSession;
	var currTurn;
	var padsBlocked = true;
	var timeouts = [];
	var sounds = [new Audio("https://s3.amazonaws.com/freecodecamp/simonSound1.mp3"), 
				new Audio("https://s3.amazonaws.com/freecodecamp/simonSound2.mp3"),
				new Audio("https://s3.amazonaws.com/freecodecamp/simonSound3.mp3"),
				new Audio("https://s3.amazonaws.com/freecodecamp/simonSound4.mp3")]; 

	$(".pad").click(function(event){
		if(!padsBlocked)
		{
			var pad = $(this);
			var padNum = parseInt(pad.attr("data-pad"));

			//the id of the pad clicked corresponds to the expected move?
			if(padNum === currSession.moves[currTurn.movesIdx])
				rightMove(pad, padNum);
			else
				wrongMove();
		}		
	});

	//game must be stopped and reset when a level is selected
	$(".level-btn").click(function(event){
		altGame();
		gameSetup($(this).attr("data-num"));
		applyRotation(0);
	});

	$("#start").click(function(){
		if($(this).html() === "Start")
		{
			$(this).html("Reset");
			$(this).removeClass("pulse");
			start();
		}
		else if($(this).html() === "Reset")
		{
			restoreFromWin();
			gameOver(1);
		}
		else
			return;
	});

	$("#strict-btn").click(function(){
		$(this).toggleClass("clicked");
		currSession.strict = $(this).hasClass("clicked");
	});

	//returns the value of the level currently selected
	function returnSelectedLevel()
	{
		var result;

		$(".level-btn").each(function(){
			if($(this).hasClass("clicked"))
				result = parseInt($(this).attr("data-num"));
		});

		return result;
	}

	//programatically 'clicks' the button corresponding to the current level
	function selectLevel(level)
	{
		if(level % 5 === 0 || level === 1)
		{
			$(".level-btn").each(function(){
				if(parseInt($(this).attr("data-num")) <= level)
					$(this).addClass("clicked");
				else
					$(this).removeClass("clicked");	
			});

			$("#display").html(level);
		}
	}

//GAME INNER FUNCTIONALITY//

	function altGame()
	{
		$("#ripple").removeClass("expand"); //prevents the show-moves process to propagate
		stopTimeOuts();
		padsBlocked = true;	
	}

	function gameSetup(level)
	{
		$("#start").html("Start");
		$("#start").addClass("pulse");
		selectLevel(level);
		currSession = new GameSession();
		currSession.init(returnSelectedLevel(), $("#strict-btn").hasClass("clicked"));
		$("#display").html(currSession.level);
	}

	function start()
	{
		applyAnimation($("#ripple"), "expand", newTurn, 350);
	}

	//stops the game
	//shows a countdown from the current level to 1 (or other parameter) 
	//initiate the reset process
	function gameOver(levelToDropTo)
	{
		altGame();
		applyRotation(0);
		var delayFactor = 1;
		$("#start").html("--"); //the start button clickability gets suspended

		for(i=currSession.level; i >= levelToDropTo; i--)
		{
			delayFactor++;
			drop(i, delayFactor);
		}

		//shows countdown by printing to display each level number with a delay
		function drop(level, delay)
		{
			setTimeout(function(){

				$("#display").html(level);
				selectLevel(level);

				if(level <= levelToDropTo) //end of countdown reached
					gameSetup(level);

			}, 75 * delay);
		}
	}

	//winning animation
	function winGame()
	{
		$("#pads-cont").addClass("spin");
		$("#display").html("WIN!").addClass("flicker");
	}

	//removes winning animation
	function restoreFromWin()
	{
		$("#pads-cont").removeClass("spin");
		applyRotation(0);
	}

	function newTurn()
	{		
		currTurn = new Turn(currSession.level);
		updateBlinkDur(currSession.blinkDur);
		showMoves();
	}

	function nextTurn()
	{
		currSession.nextLevel();

		if(currSession.level > 20)
			winGame();
		else
		{
			$("#display").html(currSession.level);
			selectLevel(currSession.level);
			start();
		}
	}

	function unblockPads()
	{
		updateBlinkDur(0.1);
		padsBlocked = false;
	}

	//clear all delayed actions when game gets abruptly stopped
	function stopTimeOuts()
	{
		for(var i=0; i < timeouts.length; i++)
			clearTimeout(timeouts[i]);

		timeouts = [];
	}

    //the process of presenting the player with the moves to perform
	function showMoves()
	{
		for(var i=0; i < currSession.moves.length; i++)
		{
			$(".pad").each(function(){
				var padNumber = parseInt($(this).attr("data-pad"));

				if(padNumber == currSession.moves[i])
				{
					var callback = false;

					//last move to be shown - shall we also rotate the board?
					if(i >= currSession.moves.length - 1)
						callback = currSession.rotate === true ? applyRotation : unblockPads;

					delayBlink($(this), padNumber, callback, i);					
				}
			});
		}
	}

	//delays the moves to have them properly sequenced
	function delayBlink(pad, padNum, callback, delayFactor)
	{
		var move = setTimeout(function(){
			playSound(padNum - 1);
			applyAnimation(pad, "blink", callback, 0);
		}, 1000/currSession.replaySpeed * delayFactor);

		timeouts.push(move);
	}

	function playSound(index)
	{
		//stops-rewind all audio files before playing the next one....
		for(var i=0; i < sounds.length; i++)
		{
			sounds[i].pause();
			sounds[i].currentTime = 0;
		}

		sounds[index].play();
	}

	//sets the right blinking duration for move-showing and player's turn
	function updateBlinkDur(dur)
	{
		$(".pad").css("-webkit-animation-duration", dur + "s");
		$(".pad").css("animation-duration", dur + "s");
	}

	//player clicked in the right pad
	function rightMove(ref, num)
	{		
		padsBlocked = true; //prevents from multiple clicks from overlapping
		currTurn.nextMove();

		if(currTurn.movesLeft <= 0) //all the moves are performed for this turn
		{
			padsBlocked = true;
			applyAnimation(ref, "blink", nextTurn, 0);
		}
		else
			applyAnimation(ref, "blink", unblockPads, 0);

		playSound(num - 1);
	}

	//player clicked the wrong pad
	function wrongMove()
	{
		padsBlocked = true;
		var callback = false;

		if(currSession.strict)
			gameOver(1);
		else
			callback = newTurn;

		applyAnimation($("#game-cont"), "shake", callback, 350);
	}

//ANIMATION SYSTEM//

	//detect and returns the animation event utilized by the current browser
	function whichAnimationEvent()
	{
		var a, el = document.createElement("fakeelement");
  		var animations = {
			"animation"      : "animationend",
			"OAnimation"     : "oAnimationEnd",
			"MozAnimation"   : "animationend",
			"WebkitAnimation": "webkitAnimationEnd"
		};

		for (a in animations)
		{
			if (el.style[a] !== undefined)
				return animations[a];
		}
	}

	//applies animation to an element and prevents it from firing more than once
	function applyAnimation(ref, anim, callback, delay)
	{
		var transitionEvent = whichAnimationEvent();
		ref.addClass(anim);
		ref.one(transitionEvent, function(event) {
			//reset the element for further animations
	    	ref.removeClass(anim);
	    	//perform passed action at the end of the animation
		    if(callback)
		    {
				var delayedCB = setTimeout(function(){callback.apply();}, delay);
				timeouts.push(delayedCB);
			}

		});
	}

	function applyRotation(deg)
	{
		var degrees = deg !== undefined ? deg : currSession.currRotation + 90;

		$("#pads-cont").css({
				'-webkit-transform' : 'rotate('+ degrees +'deg)',
				'-moz-transform' : 'rotate('+ degrees +'deg)',
				'-ms-transform' : 'rotate('+ degrees +'deg)',
				'transform' : 'rotate('+ degrees +'deg)'
        });

        currSession.currRotation = degrees;

        if(degrees > 0)
	        unblockPads();
	}

	gameSetup(1);

});
