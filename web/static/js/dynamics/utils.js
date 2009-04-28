var agilefantUtils = {
	aftimeToString: function(aftime) {
		if(!aftime || aftime < 1) {
			return "&mdash;";
		}
		var hours = Math.round(aftime/360)/10;
		if(Math.round(hours) == hours) {
			hours += ".0";
		}
		return hours + "h";
	},
	stringToAftime: function(string) {
		
	},
	isAftimeString: function(string) {
		
	},
	states: {
	  "NOT_STARTED": "Not Started",
	  "STARTED": "Started",
	  "PENDING": "Pending",
	  "BLOCKED": "Blocked",
	  "IMPLEMENTED": "Implemented",
	  "DONE": "Done"
	},
	stateToString: function(state) {
	  return agilefantUtils.states[state];
	},
	priorities: {
    "BLOCKER": "+++++",
    "CRITICAL": "++++",
    "MAJOR": "+++",
    "MINOR": "++",
    "TRIVIAL": "+",
    "UNDEFINED": "undefined"
  },
  prioritiesToNumber: {
    "BLOCKER": 1,
    "CRITICAL": 2,
    "MAJOR": 3,
    "MINOR": 4,
    "TRIVIAL": 5,
    "UNDEFINED": 0
  },
  priorityToString: function(priority) {
    return agilefantUtils.priorities[priority];
  },
	comparators: {
	  nameComparator: function(a,b) {
	    return (a.getName().toLowerCase() > b.getName().toLowerCase());
	  },
	  descComparator: function(a,b) {
	    return (a.getDescription().toLowerCase() > b.getDescription().toLowerCase());
	  },
	  priorityComparator: function(a,b) {
	    return (a.getPriority() > b.getPriority());
	  },
	  bliPriorityComparator: function(a,b) {
	    return (agilefantUtils.prioritiesToNumber[a.getPriority()] > agilefantUtils.prioritiesToNumber[b.getPriority()]);
	  },
	  effortLeftComparator: function(a,b) {
	    return (a.getEffortLeft() > b.getEffortLeft());
	  },
	  originalEstimateComparator: function(a,b) {
      return (a.getOriginalEstimate() > b.getOriginalEstimate());
    },
    effortSpentComparator: function(a,b) {
      return (a.getEffortSpent() > b.getEffortSpent());
    },
    bliStateComparator: function(a,b) {
      return (a.getState() > b.getState());
    }
	}
};