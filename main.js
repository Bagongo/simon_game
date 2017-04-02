$(document).ready(function(){

	var GameSession = function(){
		this.moves = [];
		this.level = 0;
		this.strict = null;	
		this.replaySpeed = 1;
		this.blinkDur = 0.5;

		this.addMove = function(){
			var newMove = Math.floor(Math.random() * (5 - 1) + 1);
			this.moves.push(newMove);
		}; 

		this.nextLevel = function(){
			this.level++;
			this.replaySpeed = Math.min(5, this.replaySpeed + 0.25);
			this.blinkDur = Math.max(0.1, this.blinkDur - 0.025);
			this.addMove();
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
		padClicked($(this));		
	});

	$(".level-btn").click(function(event) {
		stopMovePlay();
		padsBlocked = true;		
		selectCurrentLevel(parseInt(this.name));
		$("#start").addClass("pulse");
	});

	$("#start").click(function(){
		$(this).removeClass("pulse");
		stopMovePlay();
		gameSetup();
		newTurn();
	});

	$("#strict-btn").click(function(){
		$(this).toggleClass("clicked");
		currSession.strict = $(this).hasClass("clicked");
	});

	function returnSelectedLevel()
	{
		var result;

		$(".level-btn").each(function(){
			if(this.checked)
				result = parseInt(this.name);
		});

		return result;
	}

	function selectCurrentLevel(level)
	{
		if(level % 4 === 0 || level === 1)
		{
			$(".level-btn").each(function(){
					this.checked = parseInt(this.name) <= level;
			});

			$("#display").html(level);
		}
	}

	function gameSetup()
	{
		currSession = new GameSession();
		currSession.init(returnSelectedLevel(), $("#strict-btn").hasClass("clicked"));
		$("#display").html(currSession.level);
	}

	function newTurn()
	{		
		currTurn = new Turn(currSession.level);

		setTimeout(function(){
			showMoves();
		}, 500);
	}

	function nextTurn()
	{
		currSession.nextLevel();
		$("#display").html(currSession.level);
		selectCurrentLevel(currSession.level);
		applyAnimation($("#controller"), "anim-right", newTurn, 1);
	}

	function unblockPads()
	{
		padsBlocked = false;
	}

	function gameOver(levelToDropTo)
	{
		var delayFactor = 1;

		for(i=currSession.level; i >= levelToDropTo; i--)
		{
			delayFactor++;
			dropLevel(i, delayFactor);
		}

		function dropLevel(level, delayFactor)
		{
			setTimeout(function(){
				$("#display").html(level);
				selectCurrentLevel(level);

				if(level <= levelToDropTo)
					$("#start").addClass("pulse");

			}, 100 * delayFactor);
		}
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
						var callback = delayFactor >= currSession.moves.length - 1 ? unblockPads : false;
						updateblinkDur($(this));
						applyAnimation($(this), "blink", callback, 0);					
					}
				});

			}, 1000/currSession.replaySpeed * delayFactor);

			moveTimeouts.push(move);
		}
	}

	function updateblinkDur(ref)
	{
		ref.css("animation-duration", currSession.blinkDur + "s");
		ref.css("animation-duration", currSession.blinkDur + "s");
		console.log(ref.css("animation-duration"));
	}

	function padClicked(ref)
	{
		if(!padsBlocked)
		{
			var padNum = ref.attr("data-pad");

			if(padNum == currSession.moves[currTurn.movesIdx])
				rightMove(ref);
			else
				wrongMove(ref);
		}
	}

	function rightMove(ref)
	{
		//padsBlocked = true;
		//var callback = false;

		currTurn.nextMove();

		if(currTurn.movesLeft <= 0)
			setTimeout(nextTurn, 500);
		else
			callback = unblockPads;

		//applyAnimation(ref, "blink", callback, 1);

		applyAnimation(ref, "blink");
	}

	function wrongMove(ref)
	{
		padsBlocked = true;
		var callback = false;

		if(currSession.strict)
			gameOver(1);
		else
			callback = newTurn;

		//applyAnimation(ref, "blink");
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

	function stopMovePlay()
	{
		for(var i=0; i < moveTimeouts.length; i++)
			clearTimeout(moveTimeouts[i]);

		moveTimeouts = [];
	}

	gameSetup();

});
