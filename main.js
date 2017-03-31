$(document).ready(function(){

	var GameSession = function(level, diff){
		this.level = 1;
		this.speed = 1;
		this.strict = false;

		this.nextLevel = function(){
			this.level++;
			if(this.level % 3 === 0)
				this.speed += 0.25;
		};	 
	};

	var Turn = function(numberOfMoves){

		function generateMoves(){
			var arr = [];
			for(var i=0; i < numberOfMoves; i++)
			{
				var newMove = Math.floor(Math.random() * (5 - 1) + 1);
				arr.push(newMove);
			}

			return arr;
		}

		this.moves = generateMoves();

		this.reset = function(){
			this.movesLeft = this.moves.length;
			this.movesIdx = 0;
		};
	};

	var currSession;
	var currTurn;
	var padsBlocked = true; 

	$("#start").click(function(){
		currSession = new GameSession(1);
		$("#display").html(currSession.level);
		newTurn();
	});

	$(".pad").click(function(event){
		padClicked($(this));		
	});

	$("#strict-btn").click(function(){
		$(this).toggleClass("clicked");
		currSession.strict = $(this).hasClass("clicked");
	});

	function newTurn()
	{		
		currTurn = new Turn(currSession.level);
		currTurn.reset();

		setTimeout(function(){
			showMoves();
		}, 1000);
	}

	function nextTurn()
	{
		currSession.nextLevel();
		$("#display").html(currSession.level);
		applyAnimation($("#controller"), "anim-right", newTurn, 1);
	}

	function startTurn()
	{
		padsBlocked = false;
	}

	function gameOver()
	{
		var delayFactor = 1;

		for(i=currSession.level; i >= 1; i--)
		{
			delayFactor++;
			dropLevel(i, delayFactor);
		}

		function dropLevel(level, delayFactor)
		{
			setTimeout(function(){
				$("#display").html(level);
			}, 100 * delayFactor);
		}
	}

	function showMoves()
	{
		for(var i=0; i < currTurn.moves.length; i++)
			delayBlink(i, currTurn.moves[i]);

		function delayBlink(delayFactor, padNumber)
		{
			setTimeout(function(){
				$(".pad").each(function(){

					if($(this).attr("data-pad") == padNumber)
					{
						var callback = delayFactor >= currTurn.moves.length - 1 ? startTurn : false;
						applyAnimation($(this), "blink", callback, 0);					
					}
				});

			}, 1000/currSession.speed * delayFactor);
		}
	}

	function padClicked(ref)
	{
		if(!padsBlocked)
		{
			applyAnimation(ref, "blink");
			var padNum = ref.attr("data-pad");

			if(padNum == currTurn.moves[currTurn.movesIdx])
				rightMove();
			else
				wrongMove();
		}
	}

	function rightMove()
	{
		currTurn.movesLeft--;
		currTurn.movesIdx++;

		if(currTurn.movesLeft <= 0)
		{
			padsBlocked = true;
			setTimeout(nextTurn, 500);
		}
	}

	function wrongMove()
	{
		padsBlocked = true;
		currTurn.reset();
		var callback = false;

		if(currSession.strict)
			gameOver();
		else
			callback = showMoves;

		applyAnimation($("#game-cont"), "shake", callback, 1000);
	}

	function whichTransitionEvent()
	{
		var t, el = document.createElement("fakeelement");
  		var animations = {
			"animation"      : "animationend",
			"OAnimation"     : "oAnimationEnd",
			"MozAnimation"   : "animationend",
			"WebkitAnimation": "webkitAnimationEnd"
		};

		for (t in animations)
		{
			if (el.style[t] !== undefined)
				return animations[t];
		}
	}

	function applyAnimation(ref, anim, callback, delay)
	{
		var transitionEvent = whichTransitionEvent();
		ref.addClass(anim);
		ref.one(transitionEvent, function(event) {

	    	ref.removeClass(anim);

		    if(callback)
		    	setTimeout(function(){callback.apply();}, delay);
		});
	}

});
