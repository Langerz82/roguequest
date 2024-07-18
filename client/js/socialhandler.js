define([], function() {
  var SocialHandler = Class.extend({
    init: function(game) {
		var self = this;

		this.game = game;
		this.toggle = false;

		this.partymembers = [];
		$('#partyleave').click(function(event){
			self.game.client.sendPartyLeave();
			$('#partynames').html("");
			self.show();
		});
		$('#partyclose').click(function(e){
				self.show();
		});

		this.guildmembers = [];
		$('#guildleave').click(function(event){
			self.game.client.sendLeaveGuild();
			$('#guildnames').html("");
			self.show();
		});
		$('#socialclose').click(function(e){
				self.show();
		});

    },

    inviteParty: function (invitee)
    {
		var self = this;

		$('#socialconfirmtitle').html("Party " + invitee.name + "?");

      $('#socialconfirm').show();
	    $('#socialconfirmyes').on('click', function(event){
		    self.game.client.sendPartyInvite(invitee.name, 1);
		    $('#socialconfirm').hide();
	    });
	    $('#socialconfirmno').off().on('click', function(event){
		    self.game.client.sendPartyInvite(invitee.name, 2);
		    $('#socialconfirm').hide();
	    });

       setTimeout(function () {
         $('#socialconfirm').hide();
       }, 10000);
    },

    inviteGuild: function (guildId, guildName, invitorName)
    {
		var self = this;

      $('#socialconfirmtitle').html("Join Guild " + guildName + "?");

        $('#socialconfirm').show();
  	    $('#socialconfirmyes').on('click', function(event){
  		    self.game.client.sendGuildInviteReply(guildId, true);
  		    $('#socialconfirm').hide();
  	    });
  	    $('#socialconfirmno').on('click', function(event){
  		    self.game.client.sendGuildInviteReply(guildId, false);
  		    $('#socialconfirm').hide();
  	    });

         setTimeout(function () {
           $('#socialconfirm').hide();
         }, 10000);
    },

    show: function() {
        this.toggle = !this.toggle;
    	if (this.toggle)
    	{
            this.displayParty();
			this.displayGuild();
			$('#socialwindow').css('display', 'block');
        }
        else
        {
            $('#socialwindow').css('display', 'none');
        }
    },
    setPartyMembers: function(members){
      this.partymembers = members;
      this.displayParty();
    },

    setGuildMembers: function(members){
      this.guildmembers = members;
      this.displayGuild();
    },

    displayParty: function () {
      if (this.partymembers.length <= 1)
      {
      	  $('#partynames').html("No party.");
          return;
      }
	  else
	  {
		  $('#partyleave').show();
	  }

      var htmlStr = "<table><tr><th>Name</th></tr>";
      htmlStr += "<tr><td>" + this.partymembers[0] + " (L)</td></tr>";
      for(var i=1; i < this.partymembers.length; ++i){
          htmlStr += "<tr><td>" + this.partymembers[i] + "</td></tr>";
      }
      htmlStr += "</table>";
      $('#partynames').html(htmlStr);
    },

    displayGuild: function () {
      if (this.guildmembers.length <= 0)
      {
      	  $('#guildnames').html("No guild.");
          return;
      }
	  else
	  {
		  $('#guildleave').show();
	  }

      var htmlStr = "<table><tr><th>Name</th></tr>";
      htmlStr += "<tr><td>" + this.guildmembers[0] + " (L)</td></tr>";
      for(var i=1; i < this.guildmembers.length; ++i){
          htmlStr += "<tr><td>" + this.guildmembers[i] + "</td></tr>";
      }
      htmlStr += "</table>";
      $('#guildnames').html(htmlStr);

    },

    isPartyLeader: function (name) {
    	return name === this.partymembers[0];
    },

    isPartyMember: function (name) {
    	return (this.partymembers.indexOf(name) > -1);
    },

    isGuildLeader: function (name) {
    	return name === this.guildmembers[0];
    },

    isGuildMember: function (name) {
    	return (this.guildmembers.indexOf(name) > -1);
    }

  });
  return SocialHandler;
});
