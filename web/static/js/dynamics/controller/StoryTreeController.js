/**
 * Story tree controller.
 * 
 * @constructor
 * @base CommonController
 * @param {DOMElement} element DOM parent node for the story table. 
 */
var StoryTreeController = function StoryTreeController(id, type, element, options, parentController) {
  this.id = id;
  this.type = type;
  this.filters = [];
  this.parentElement = element;
  this.container = $('<div />').addClass("storyTreeContainer").appendTo(this.parentElement);
  this.headerElement = $('<div/>').appendTo(this.container);
  this.element = $('<div/>').appendTo(this.container);
  this.parentController = parentController;
  this.options = {
    refreshCallback: null,
    disableRootSort: false
  };
  this.storyFilters = {
      statesToKeep: ["NOT_STARTED", "STARTED", "PENDING", "BLOCKED", "IMPLEMENTED", "DONE"]
  };
  jQuery.extend(this.options, options);
  this.initHeader();
};
StoryTreeController.prototype = new CommonController();
StoryTreeController.createNodeUrls = {
    "inside": "ajax/treeCreateStoryUnder.action", 
    "after": "ajax/treeCreateStorySibling.action"
};
StoryTreeController.moveNodeUrls =  {
    "before": "ajax/moveStoryBefore.action",
    "after": "ajax/moveStoryAfter.action",
    "inside": "ajax/moveStoryUnder.action"
};


StoryTreeController.prototype.resetFilter = function() {
  this.storyFilters = {
      statesToKeep: ["NOT_STARTED", "STARTED", "PENDING", "BLOCKED", "IMPLEMENTED", "DONE"]
  };
  this.filterImg.removeClass("storytree-filterimg-active");
};

StoryTreeController.prototype.refresh = function() {
  if(!this.tree) {
    this.initTree();
    return;
  }
  this.tree.refresh();
};

/**
 * Updates a single node of the tree.
 * @attr {jsTree node} element the <li>-element of the node to be refreshed. 
 */
StoryTreeController.prototype.refreshNode = function(element) {
  var node = $(element);
  jQuery.get(
      "ajax/treeRetrieveStory.action",
      {
        "storyId": parseInt($(node).attr("storyId"), 10)
      },
      function(data, textStatus, xhr) {
        var elem = $(data);
        var contents = elem.find("a:eq(0)");
        var rel = elem.attr("rel");
        
        // Replace
        node.attr("rel", rel);
        node.find("a:eq(0)").replaceWith(contents);
      }
  );
};

StoryTreeController.prototype.initHeader = function() {
  var me = this;
  var heading = $('<div class="dynamictable-caption" style="margin-bottom: 1em;"></div>').appendTo(this.headerElement);
  
  var title = $('<div style="float: left; width:50%"><span style="float: left;">Story tree</span></div>').appendTo(heading);
  this.filterImg = $('<div/>').addClass("storytree-filterimg").appendTo(title);
  
  this.filterImg.click(function() {
    var bub = new Bubble($(this), {
      title: "Filter by state",
      offsetX: -15,
      minWidth: 100,
      minHeight: 20,
      closeCallback: function() { me.parentController.filter(); }
    });
    var widget = new StateFilterWidget(bub.getElement(), {
      callback: function(isActive) {
        if (isActive) {
          me.filterImg.addClass("storytree-filterimg-active");
        }
        else {
          me.filterImg.removeClass("storytree-filterimg-active");
        }
        me.storyFilters.statesToKeep = widget.getFilter();
      },
      activeStates: me.storyFilters.statesToKeep
    });
  });
  
  
  var actions = $('<ul/>').addClass('dynamictable-captionactions').css({'width': '40%', 'float': 'right'}).appendTo(heading);
  
  $('<li>Create story</li>').css({'float': 'right'})
    .addClass("dynamictable-captionaction create").click(function() {
      me.createNode(-1, 0, 0);
  }).appendTo(actions);
  
  this.expandButton = $('<li>Expand all</li>').css({'float': 'right'}).addClass("dynamictable-captionaction create").appendTo(actions);
  this.collapseButton = $('<li>Collapse all</li>').css({'float': 'right'}).hide().addClass("dynamictable-captionaction create").appendTo(actions);
  
  this.expandButton.click(function() {
    $(this).hide();
    me.collapseButton.show();
    me.treeExpanded = true;
    me.tree.open_all();
  });
  me.collapseButton.click(function() {
    $(this).hide();
    me.expandButton.show();
    me.treeExpanded = false;
    me.tree.close_all();
  });
};

StoryTreeController.prototype._storyFilters = function(node, tree_obj) {
  var tmp = {};
  if(this.storyFilters.name) {
   tmp["storyFilters.name"] = this.storyFilters.name;
  }
  if(this.storyFilters.statesToKeep) {
    tmp["storyFilters.states"] = this.storyFilters.statesToKeep;
  }
  if (this.type == 'project') {
    tmp.projectId = this.id;
  } else if (this.type == 'product') {
    tmp.productId = this.id;
  }
  return tmp;
};

StoryTreeController.prototype.filter = function(name, storyStates) {

  this.storyFilters.statesToKeep = storyStates;
  this.storyFilters.name = name;

  this.refresh();
};

StoryTreeController.prototype.hasFilters = function() {
  return this.storyFilters.name
      || (this.storyFilters.states && this.storyFilters.states.length === 6);
};

StoryTreeController.prototype._searchByText = function() {
  if (this.storyFilters.name) {
    this.tree.search(this.storyFilters.name);
  }
};

StoryTreeController.prototype.initTree = function() {
  // Change the jsTree theme folder
  $.jstree._themes = "static/css/jstree/";
  
  
  var urlInfo = {
    "project": {
      url: "ajax/getProjectStoryTree.action",
      data: {
        "projectId": this.id
      }
    },
    "product": {
      url: "ajax/getProductStoryTree.action",
      data: {
        "productId": this.id
      }
    }
  };
  
  // Url params
  var me = this;
  
  var overlay = $('<div><div style="border: 1px solid #ccc; display: inline-block; vertical-align: middle; margin-top: 5%; background-color: white;"><img src="static/img/pleasewait.gif" style="display: inline-block; vertical-align: middle;" /> Please wait...</div></div>').css({
    "background-color": "#999999",
    "position": "absolute",
    "opacity": "0.5",
    "border": "1px solid #666666",
    "width": "99%",
    "height": "99%",
    "top": "0",
    "left": "0",
    "text-align": "center",
    "vertical-align": "middle"
  }).appendTo(this.parentElement);
  
  this.tree = $(this.element).jstree({
    plugins: [ "html_data", "themes", "types", "dnd", "crrm", "cookies", "ui", "search" ],
    core: {
      animation: 0,
      html_titles: true
    },
    html_data: {
      ajax: {
        url: urlInfo[this.type].url,
        type: "POST",
        beforeSend: function(xhr) {
          overlay.show();
          return xhr;
        },
        data: function() {
          var data = {
            "storyFilters.states": me.storyFilters.statesToKeep
          };
          if (me.storyFilters.name) {
            data["storyFilters.name"] = me.storyFilters.name;
          }
          jQuery.extend(data, urlInfo[me.type].data);
          return data;
        },
        complete: function() {
          overlay.fadeOut('fast');
          me._searchByText();
        }
      }
    },
    themes: {
      theme: "storytree",
      dots: true,
      icons: false,
      theme_path: "static/css/jstree/agilefant/style.css"
    },
    types: {
      validChildren: [ "story", "iteration_story" ],
      types: {
        "story": {
          "max_children": -1,
          "valid_children": "all"
        },
        "iteration_story": {
          "max_children": -1,
          "valid_children": "none"
        }
      }
    },
    crrm: {},
    dnd: {
      "copy_modifier": "",
      "open_timeout": 1000
    },
    cookies: {
      "save_selected": false
    },
    ui: {
      "select_limit": 1,
      "initially_select": []
    },
    search: {
      "case_insensitive": true
    }
  });
  this.tree = jQuery.jstree._reference(this.element);
  
  this.element.bind('move_node.jstree', function(event, data) {
    // See http://www.jstree.com/documentation/core
    me.moveStory(data.rslt.o, data.rslt.r, data.rslt.p, data.inst, data.rlbk);
  });
  this.element.bind('select_node.jstree', function(event, data) {
    me.openNodeDetails(data.rslt.obj);
    me.tree.deselect_node(data.rslt.obj);
  });
};
StoryTreeController.prototype._treeLoaded = function() {
  if(this.treeExpanded) {
    this.tree.open_all();
  }
  if(this.hasFilters()) {
    this.expandButton.click();
  }
};
StoryTreeController.prototype.moveStory = function(node, ref_node, type, tree_obj, rb) {
  var myId = $(node).attr("storyid");
  var refId = $(ref_node).attr("storyid");
  var data = {storyId: myId, referenceStoryId: refId};
  var me = this;
  $.ajax({
    url: StoryTreeController.moveNodeUrls[type],
    data: data,
    type: "post",
    async: true,
    error: function(xhr, status, error) {
      if(xhr) {
          var json =  jQuery.httpData(xhr, "json", null);
          if (json.constructor == Array) {
            var title = 'Can&apos;t move story. Reason:';
            var message = '<ul style="margin: 0; width: 400px; font-weight: normal; white-space: nowrap;"><li>' + json.join('</li><li>') + '</li></ul>';
            MessageDisplay.Warning(title, message, { closeButton: true, displayTime: null });
          }
          else {
            MessageDisplay.Error("Error moving story", xhr);
          }
      }
      jQuery.jstree.rollback(rb);
    }
  });
};
StoryTreeController.prototype.checkStoryMove = function(node, ref_node, type, tree_obj, rb) {
  if($(ref_node).attr("rel") === "iteration_story" && type === "inside") {
    MessageDisplay.Warning("Iteration stories can not have children");
    return false;
  }
  if(this.options.disableRootSort) {
    var ref_parent = tree_obj.parent(ref_node);
    if(ref_parent === -1 && type !== "inside") {
      alert("Not implemented.");
      return false;
    }
  }
  return true;
};
StoryTreeController.prototype._getStoryForId = function(id, callback) {
  var model = ModelFactory.getInstance().retrieveLazily(
    ModelFactory.types.story,
    id,
    function(type, id, object) {
      callback(object);
    },
    function(xhr, status, error) {
      MessageDisplay.Error('Story cannot be loaded', xhr);
    }
  );
};

StoryTreeController.prototype.createNode = function(refNode, position, parentStory) {
  var me = this;
  if($(refNode).attr("rel") === "iteration_story" && position === "inside") {
    MessageDisplay.Warning("Iteration stories can not have children");
    return false;
  }
  
  var nameField = $('<input type="text" size="75"/>').css( {
    'margin' : '0px'
  });
  var node = this.tree.create(refNode, position, {}, function(node) {
    var nodeNameEl = node.find("a").hide();
    // Hide the "New folder" line
    node.find("span").hide();
    
    var container = $('<div />').css({'white-space':'nowrap','display':'inline-block','height':'16px'}).appendTo(node);
    nameField.appendTo(container);
    
    var saveStory = function(event) {
      event.stopPropagation();
      event.preventDefault();
      if (parentStory === 0) {
        $.post("ajax/treeCreateRootStory.action", {backlogId: me.id, "story.name": nameField.val()}, function(fragment) {
          node.remove();
          var newNode;
          var newData = $(fragment);
          newNode = me.tree.create(me.tree,"last",{ data: newData.find('a:eq(0)').html() },null,true);
          newNode.attr( {
            'id' : newData.attr('id'),
            'rel' : newData.attr('rel'),
            'storystate' : newData.attr('storystate'),
            'storyid' : newData.attr('storyid')
          });
        },"html");
      }
      else {
        $.post(StoryTreeController.createNodeUrls[position], {storyId: parentStory, "story.name": nameField.val()}, function(fragment) {
          node.remove();
          var newData = $(fragment);
          var newNode = me.tree.create(refNode,position,{ data: newData.find('a:eq(0)').html() },null,true);
          newNode.attr( {
            'id' : newData.attr('id'),
            'rel' : newData.attr('rel'),
            'storystate' : newData.attr('storystate'),
            'storyid' : newData.attr('storyid')
          });
        },"html");
      }
    };
    var cancelFunc = function() {
      container.remove();
      me.tree.remove(node);
    };
    
    $('<input type="button" value="save" />').appendTo(container).click(saveStory);
    nameField.keyup(function(event) {
      if(event.keyCode === 13) {
        saveStory(event);
      } else if(event.keyCode === 27) {
        cancelFunc();
      }    
    });
    $('<input type="button" value="cancel" />').click(cancelFunc).appendTo(container);
  }, true);
  nameField.focus();
};

StoryTreeController.prototype.removeNode = function(node) {
  var refresh = false;
  var children = node.children('li');
  var length = children.length;
  if (node.find('li').length > 0) {
    refresh = true;
  }
  this.tree.remove(node);
  if (refresh) {
    this.tree.refresh();
  }
};

/**
 * Initializes the tree.
 * 
 * Will send an ajax request.
 */
StoryTreeController.prototype.openNodeDetails = function(node) {
  var bubble = new StoryInfoBubble($(node).attr('storyid'), this, $(node), {});
};



