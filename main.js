$(document).ready(function(){

	var GameSession = function(){
		this.moves = [];
		this.level = 0;
		this.strict = null;	
		this.replaySpeed = 1;
		this.blinkDur = 0.5;
		this.rotate = false;
		this.currRotation = 0;

		this.addMove = function(){
			var newMove = Math.floor(Math.random() * (5 - 1) + 1);
			this.moves.push(newMove);
		}; 

		this.nextLevel = function(){
			this.level++;
			this.replaySpeed = Math.min(5, this.replaySpeed + 0.15);
			this.blinkDur = Math.max(0.2, this.blinkDur - 0.015);
			this.addMove();
			this.rotate = this.level >= 15;
		};

		this.init = function(level, strict){
			for(var i=0; i < level; i++)
				this.nextLevel();

			this.strict = strict;
		};
	};

	var Turn = function(numberOfMoves){
		this.movesLeft = numberOfMoves;
		this.movesIdx = 0;

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

			if(padNum === currSession.moves[currTurn.movesIdx])
				rightMove(pad, padNum);
			else
				wrongMove();
		}		
	});

	$(".level-btn").click(function(event){
		$("#start").html("start");
		$("#start").addClass("pulse");
		altGame();
		applyRotation(0);
		gameSetup(parseInt($(this).attr("data-num")));
	});

	$("#start").click(function(){
		if($(this).html() === "start")
		{
			$(this).html("reset");
			$(this).removeClass("pulse");
			startGame();
		}
		else if($(this).html() === "reset")
		{
			restoreFromWin();
			dropLevels(1);
		}
		else
			return;
	});

	$("#strict-btn").click(function(){
		$(this).toggleClass("clicked");
		currSession.strict = $(this).hasClass("clicked");
	});

	function returnSelectedLevel()
	{
		var result;

		$(".level-btn").each(function(){
			if($(this).hasClass("clicked"))
				result = parseInt($(this).attr("data-num"));
		});

		return result;
	}

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

	function altGame()
	{
		$("#ripple").removeClass("expand");
		stopTimeOuts();
		padsBlocked = true;	
	}

	function resetGame(toLevel)
	{
		gameSetup(toLevel);
		$("#start").html("start");
		$("#start").addClass("pulse");
	}

	function gameSetup(level)
	{
		selectLevel(level);
		currSession = new GameSession();
		currSession.init(returnSelectedLevel(), $("#strict-btn").hasClass("clicked"));
		$("#display").html(currSession.level);
	}

	function startGame()
	{
		applyAnimation($("#ripple"), "expand", newTurn, 350);
	}

	function dropLevels(levelToDropTo)
	{
		altGame();
		applyRotation(0);
		var delayFactor = 1;
		$("#start").html("--");

		for(i=currSession.level; i >= levelToDropTo; i--)
		{
			delayFactor++;
			drop(i, delayFactor);
		}

		function drop(level, delay)
		{
			setTimeout(function(){

				$("#display").html(level);
				selectLevel(level);

				if(level <= levelToDropTo)
					resetGame(level);

			}, 75 * delay);
		}
	}

	function winGame()
	{
		$("#pads-cont").addClass("spin");
		$("#display").html("WIN!").addClass("flicker");
	}

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
			applyAnimation($("#ripple"), "expand", newTurn, 350);
		}
	}

	function unblockPads()
	{
		updateBlinkDur(0.1);
		padsBlocked = false;
	}

	function stopTimeOuts()
	{
		for(var i=0; i < timeouts.length; i++)
			clearTimeout(timeouts[i]);

		timeouts = [];
	}

	function showMoves()
	{
		for(var i=0; i < currSession.moves.length; i++)
		{
			$(".pad").each(function(){
				var padNumber = parseInt($(this).attr("data-pad"));

				if(padNumber == currSession.moves[i])
				{
					var callback = false;

					if(i >= currSession.moves.length - 1)
						callback = currSession.rotate === true ? applyRotation : unblockPads;

					delayBlink($(this), padNumber, callback, i);					
				}
			});
		}
	}

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
		for(var i=0; i < sounds.length; i++)
		{
			sounds[i].pause();
			sounds[i].currentTime = 0;
		}

		sounds[index].play();
	}

	function updateBlinkDur(dur)
	{
		$(".pad").css("-webkit-animation-duration", dur + "s");
		$(".pad").css("animation-duration", dur + "s");
	}

	function rightMove(ref, num)
	{
		//uncomment and regulate player input blink anim to prevent multiple clicks 
		
		//padsBlocked = true;
		currTurn.nextMove();

		if(currTurn.movesLeft <= 0)
		{
			padsBlocked = true;
			applyAnimation(ref, "blink", nextTurn, 0);
		}
		else
			applyAnimation(ref, "blink");

		playSound(num - 1);
		// else
			//applyAnimation(ref, "blink", unblockPads, 0);
	}

	function wrongMove()
	{
		padsBlocked = true;
		var callback = false;

		if(currSession.strict)
			dropLevels(1);
		else
			callback = newTurn;

		applyAnimation($("#game-cont"), "shake", callback, 350);
	}

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

	function applyAnimation(ref, anim, callback, delay)
	{
		var transitionEvent = whichAnimationEvent();
		ref.addClass(anim);
		ref.one(transitionEvent, function(event) {

	    	ref.removeClass(anim);

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
