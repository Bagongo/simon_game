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
			this.replaySpeed = Math.min(5, this.replaySpeed + 0.25);
			this.blinkDur = Math.max(0.1, this.blinkDur - 0.025);
			this.addMove();
			this.rotate = this.level >= 12;
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
	var moveTimeouts = []; 

	$(".pad").click(function(event){
		if(!padsBlocked)
		{
			var pad = $(this);
			if(pad.attr("data-pad") == currSession.moves[currTurn.movesIdx])
				rightMove(pad);
			else
				wrongMove();
		}		
	});

	$(".level-btn").click(function(event) {
		altGame();
		gameSetup(parseInt($(this).attr("data-name")));
		$("#start").html("start");
		$("#start").addClass("pulse");
	});

	$("#start").click(function(){
		if($(this).html() === "start")
		{
			$(this).removeClass("pulse");
			$(this).html("reset");
			startGame();
		}
		else if($(this).html() === "reset")
		{
			altGame();
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
				result = parseInt($(this).attr("data-name"));
		});

		return result;
	}

	function selectCurrentLevel(level)
	{
		if(level % 4 === 0 || level === 1)
		{
			$(".level-btn").each(function(){
				if(parseInt($(this).attr("data-name")) <= level)
					$(this).addClass("clicked");
				else
					$(this).removeClass("clicked");	
			});

			$("#display").html(level);
		}
	}

	function altGame()
	{
		stopShowMoves();
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
		selectCurrentLevel(level);
		currSession = new GameSession();
		currSession.init(returnSelectedLevel(), $("#strict-btn").hasClass("clicked"));
		$("#display").html(currSession.level);
	}

	function startGame()
	{
		applyAnimation($("#ripple"), "expand", newTurn, 250);
	}

	function dropLevels(levelToDropTo)
	{
		var delayFactor = 1;
		$("#start").html("--");
		applyRotation(0);

		for(i=currSession.level; i >= levelToDropTo; i--)
		{
			delayFactor++;
			drop(i, delayFactor);
		}

		function drop(level, delay)
		{
			setTimeout(function(){

				$("#display").html(level);
				selectCurrentLevel(level);

				if(level <= levelToDropTo)
					resetGame(level);

			}, 100 * delay);
		}
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
		$("#display").html(currSession.level);
		selectCurrentLevel(currSession.level);
		applyAnimation($("#ripple"), "expand", newTurn, 250);
	}

	function unblockPads()
	{
		updateBlinkDur(0.1);
		padsBlocked = false;
	}

	function stopShowMoves()
	{
		for(var i=0; i < moveTimeouts.length; i++)
			clearTimeout(moveTimeouts[i]);

		moveTimeouts = [];
	}

	function showMoves()
	{
		for(var i=0; i < currSession.moves.length; i++)
			delayBlink(i, currSession.moves[i]);

		function delayBlink(delayFactor, padNumber)
		{
			var move = setTimeout(function(){
				$(".pad").each(function(){

					if($(this).attr("data-pad") == padNumber)
					{
						var callback = false;

						if(delayFactor >= currSession.moves.length - 1)
							callback = currSession.rotate === true ? applyRotation : unblockPads;

						applyAnimation($(this), "blink", callback, 0);					
					}
				});

			}, 1000/currSession.replaySpeed * delayFactor);

			moveTimeouts.push(move);
		}
	}

	function updateBlinkDur(dur)
	{
		$(".pad").css("-webkit-animation-duration", dur + "s");
		$(".pad").css("animation-duration", dur + "s");
	}

	function rightMove(ref)
	{
		//uncomment and regulate player input blink anim to prevent multiple clicks 
		
		//padsBlocked = true;
		currTurn.nextMove();

		if(currTurn.movesLeft <= 0)
			applyAnimation(ref, "blink", nextTurn, 0);
		else
			applyAnimation(ref, "blink");

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

		applyAnimation($("#game-cont"), "shake", callback, 1);
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
		    	setTimeout(function(){callback.apply();}, delay);
		});
	}

	function applyRotation(deg)
	{
		var degrees = deg !== undefined ? deg : currSession.currRotation + 90;

		console.log(degrees); 

		$("#pads-cont").css({'-webkit-transform' : 'rotate('+ degrees +'deg)',
                 '-moz-transform' : 'rotate('+ degrees +'deg)',
                 '-ms-transform' : 'rotate('+ degrees +'deg)',
                 'transform' : 'rotate('+ degrees +'deg)'
        });

        currSession.currRotation = degrees;
        unblockPads();
	}

	gameSetup(1);

});
