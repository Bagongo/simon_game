$(document).ready(function(){

	var GameSession = function(level, diff){
		this.level = 1;
		this.speed = 1;
		this.gameMode = null; // = strict????

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
		this.dropMove =  function(){
			this.moves.shift();
		};
	};

	var currSession;
	var currTurn;
	var padsBlocked = true; 

	$("#start").click(function(){
		currSession = new GameSession(1);
		newTurn();
	});

	$(".pad").click(function(event){
		padClicked($(this));		
	});

	function showMoves(moves)
	{
		for(var i=0; i < moves.length; i++)
			delayBlink(i, moves[i]);

		function delayBlink(delayFactor, padNumber)
		{
			setTimeout(function(){

				$(".pad").each(function(){
					if($(this).attr("data-pad") == padNumber)
					{
						var callback = delayFactor >= moves.length - 1 ? startTurn : false;
						makeBlink($(this), callback);					
					}
				});

			}, 1000/currSession.speed * delayFactor);
		}
	}

	function nextTurn()
	{
		padsBlocked = true;
		currSession.nextLevel();
		newTurn();
	}

	function newTurn()
	{		
		currTurn = new Turn(currSession.level);

		setTimeout(function(){
			showMoves(currTurn.moves);
		}, 1500);
	}

	function startTurn()
	{
		padsBlocked = false;
	}

	function padClicked(ref)
	{
		if(!padsBlocked)
		{
			makeBlink(ref);
			var padNum = ref.attr("data-pad");

			if(padNum == currTurn.moves[0])
				rightMove();
			else
				wrongMove();
		}
	}

	function rightMove()
	{
		currTurn.dropMove();

		if(currTurn.moves.length <= 0)
			nextTurn();
	}

	function wrongMove()
	{
		padsBlocked = true;
		console.log("wrong pad touched!!! restart game!");
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

	function makeBlink(ref, callback)
	{
		var transitionEvent = whichTransitionEvent();
		ref.addClass("blink");
		ref.one(transitionEvent, function(event) {
		    ref.removeClass("blink");
		    if(callback)
			    callback.call();
		});
	}

});
