"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _cloneDeep = _interopRequireDefault(require("lodash/cloneDeep"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

//TODO maybe don't use
var SelectorConfig = /*#__PURE__*/function () {
  function SelectorConfig(name, config) {
    _classCallCheck(this, SelectorConfig);

    this.name = name || 'Unnamed Selector Configuration';
    this.defaultComposition = {
      classes: true,
      ids: true,
      tags: true,
      attributes: false,
      excludeRandomSelectors: true,
      exceptions: {}
    };

    if (!config) {
      this.useDefaultComposition();
    } else {
      this.composition = {
        classes: config.classes,
        ids: config.ids,
        tags: config.tags,
        attributes: config.attributes,
        excludeRandomSelectors: config.excludeRandomSelectors,
        exceptions: config.exceptions
      };
    }

    this.validCompositionProperties = ['classes', 'attributes', 'ids', 'tags', 'excludeRandomSelectors', 'exceptions'];
  }

  _createClass(SelectorConfig, [{
    key: "modifyComposition",
    value: function modifyComposition(compositionProperty, value) {
      if (!this.validCompositionProperties.includes(compositionProperty)) {
        return console.error('Invalid composition property:', compositionProperty);
      } // save current composition


      this.saveComposition(); // change composition

      this.composition[compositionProperty] = value;
    }
  }, {
    key: "saveComposition",
    value: function saveComposition() {
      this.savedComposition = (0, _cloneDeep["default"])(this.composition);
    }
  }, {
    key: "getComposition",
    value: function getComposition() {
      return this.composition;
    }
  }, {
    key: "getForbiddenClassSubstrings",
    value: function getForbiddenClassSubstrings() {
      return this.composition.exceptions && this.composition.exceptions.forbiddenClassSubstrings || [];
    }
  }, {
    key: "getForbiddenIdSubstrings",
    value: function getForbiddenIdSubstrings() {
      return this.composition.exceptions && this.composition.exceptions.forbiddenIdSubstrings || [];
    }
  }, {
    key: "getForbiddenAttributeSubstrings",
    value: function getForbiddenAttributeSubstrings() {
      return this.composition.exceptions && this.composition.exceptions.forbiddenAttributeSubstrings || [];
    }
  }, {
    key: "deleteForbiddenClassSubstring",
    value: function deleteForbiddenClassSubstring(substring) {
      var forbiddenClassSubstrings = this.getForbiddenClassSubstrings();
      var index = forbiddenClassSubstrings.indexOf(substring);

      if (index >= 0) {
        this.composition.exceptions.forbiddenClassSubstrings.splice(index, 1);
      }
    }
  }, {
    key: "deleteForbiddenIdSubstring",
    value: function deleteForbiddenIdSubstring(substring) {
      var forbiddenIdSubstrings = this.getForbiddenIdSubstrings();
      var index = forbiddenIdSubstrings.indexOf(substring);

      if (index >= 0) {
        this.composition.exceptions.forbiddenIdSubstrings.splice(index, 1);
      }
    }
  }, {
    key: "deleteForbiddenAttributeSubstring",
    value: function deleteForbiddenAttributeSubstring(substring) {
      var forbiddenAttributeSubstrings = this.getForbiddenAttributeSubstrings();
      var index = forbiddenAttributeSubstrings.indexOf(substring);

      if (index >= 0) {
        this.composition.exceptions.forbiddenAttributeSubstrings.splice(index, 1);
      }
    }
  }, {
    key: "insertForbiddenClassSubstring",
    value: function insertForbiddenClassSubstring(substring) {
      var forbiddenClassSubstrings = this.getForbiddenClassSubstrings();
      forbiddenClassSubstrings.push(substring);
      this.composition.exceptions.forbiddenClassSubstrings = forbiddenClassSubstrings;
    }
  }, {
    key: "insertForbiddenIdSubstring",
    value: function insertForbiddenIdSubstring(substring) {
      var forbiddenIdSubstrings = this.getForbiddenIdSubstrings();
      forbiddenIdSubstrings.push(substring);
      this.composition.exceptions.forbiddenIdSubstrings = forbiddenIdSubstrings;
    }
  }, {
    key: "insertForbiddenAttributeSubstring",
    value: function insertForbiddenAttributeSubstring(substring) {
      var forbiddenAttributeSubstrings = this.getForbiddenAttributeSubstrings();
      forbiddenAttributeSubstrings.push(substring);
      this.composition.exceptions.forbiddenAttributeSubstrings = forbiddenAttributeSubstrings;
    }
  }, {
    key: "restoreSavedComposition",
    value: function restoreSavedComposition() {
      this.composition = (0, _cloneDeep["default"])(this.savedComposition);
    }
  }, {
    key: "useDefaultComposition",
    value: function useDefaultComposition() {
      this.composition = (0, _cloneDeep["default"])(this.defaultComposition);
    }
  }, {
    key: "isAllowIds",
    value: function isAllowIds() {
      return this.composition.ids;
    }
  }, {
    key: "isAllowClasses",
    value: function isAllowClasses() {
      return this.composition.classes;
    }
  }, {
    key: "isAllowAttributes",
    value: function isAllowAttributes() {
      return this.composition.attributes;
    }
  }, {
    key: "isAllowTags",
    value: function isAllowTags() {
      return this.composition.tags;
    }
  }, {
    key: "isExcludingRandomSelectors",
    value: function isExcludingRandomSelectors() {
      return this.composition.excludeRandomSelectors;
    }
  }, {
    key: "isCompositionValid",
    value: function isCompositionValid() {
      var _this$composition = this.composition,
          ids = _this$composition.ids,
          classes = _this$composition.classes,
          tags = _this$composition.tags,
          attributes = _this$composition.attributes;
      return ids || classes || tags || attributes;
    }
  }, {
    key: "clone",
    value: function clone() {
      return new SelectorConfig(this.name, (0, _cloneDeep["default"])(this.composition));
    }
  }, {
    key: "isIncludedInConfig",
    value: function isIncludedInConfig(otherConfig) {
      var _this = this;

      var otherComposition = otherConfig.getComposition();
      return Object.keys(this.composition).every(function (property) {
        return _this.composition[property] ? otherComposition[property] : true;
      });
    }
  }]);

  return SelectorConfig;
}();

var _default = SelectorConfig;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNlbGVjdG9yLWdlbmVyYXRpb24vc2VsZWN0b3ItY29uZmlndXJhdGlvbi5qcyJdLCJuYW1lcyI6WyJTZWxlY3RvckNvbmZpZyIsIm5hbWUiLCJjb25maWciLCJkZWZhdWx0Q29tcG9zaXRpb24iLCJjbGFzc2VzIiwiaWRzIiwidGFncyIsImF0dHJpYnV0ZXMiLCJleGNsdWRlUmFuZG9tU2VsZWN0b3JzIiwiZXhjZXB0aW9ucyIsInVzZURlZmF1bHRDb21wb3NpdGlvbiIsImNvbXBvc2l0aW9uIiwidmFsaWRDb21wb3NpdGlvblByb3BlcnRpZXMiLCJjb21wb3NpdGlvblByb3BlcnR5IiwidmFsdWUiLCJpbmNsdWRlcyIsImNvbnNvbGUiLCJlcnJvciIsInNhdmVDb21wb3NpdGlvbiIsInNhdmVkQ29tcG9zaXRpb24iLCJmb3JiaWRkZW5DbGFzc1N1YnN0cmluZ3MiLCJmb3JiaWRkZW5JZFN1YnN0cmluZ3MiLCJmb3JiaWRkZW5BdHRyaWJ1dGVTdWJzdHJpbmdzIiwic3Vic3RyaW5nIiwiZ2V0Rm9yYmlkZGVuQ2xhc3NTdWJzdHJpbmdzIiwiaW5kZXgiLCJpbmRleE9mIiwic3BsaWNlIiwiZ2V0Rm9yYmlkZGVuSWRTdWJzdHJpbmdzIiwiZ2V0Rm9yYmlkZGVuQXR0cmlidXRlU3Vic3RyaW5ncyIsInB1c2giLCJvdGhlckNvbmZpZyIsIm90aGVyQ29tcG9zaXRpb24iLCJnZXRDb21wb3NpdGlvbiIsIk9iamVjdCIsImtleXMiLCJldmVyeSIsInByb3BlcnR5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7Ozs7Ozs7Ozs7QUFBMEM7SUFFcENBLGM7QUFDSiwwQkFBWUMsSUFBWixFQUFrQkMsTUFBbEIsRUFBMEI7QUFBQTs7QUFDeEIsU0FBS0QsSUFBTCxHQUFZQSxJQUFJLElBQUksZ0NBQXBCO0FBQ0EsU0FBS0Usa0JBQUwsR0FBMEI7QUFDeEJDLE1BQUFBLE9BQU8sRUFBRSxJQURlO0FBRXhCQyxNQUFBQSxHQUFHLEVBQUUsSUFGbUI7QUFHeEJDLE1BQUFB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LEtBQUtJLFdBQUwsQ0FBaUJMLElBQXhCO0FBQ0Q7OztpREFFNEI7QUFDM0IsYUFBTyxLQUFLSyxXQUFMLENBQWlCSCxzQkFBeEI7QUFDRDs7O3lDQUVvQjtBQUFBLDhCQUNvQixLQUFLRyxXQUR6QjtBQUFBLFVBQ2ROLEdBRGMscUJBQ2RBLEdBRGM7QUFBQSxVQUNURCxPQURTLHFCQUNUQSxPQURTO0FBQUEsVUFDQUUsSUFEQSxxQkFDQUEsSUFEQTtBQUFBLFVBQ01DLFVBRE4scUJBQ01BLFVBRE47QUFHbkIsYUFBT0YsR0FBRyxJQUFJRCxPQUFQLElBQWtCRSxJQUFsQixJQUEwQkMsVUFBakM7QUFDRDs7OzRCQUVPO0FBQ04sYUFBTyxJQUFJUCxjQUFKLENBQW1CLEtBQUtDLElBQXhCLEVBQThCLDJCQUFVLEtBQUtVLFdBQWYsQ0FBOUIsQ0FBUDtBQUNEOzs7dUNBRWtCb0IsVyxFQUFhO0FBQUE7O0FBQzlCLFVBQU1DLGdCQUFnQixHQUFHRCxXQUFXLENBQUNFLGNBQVosRUFBekI7QUFFQSxhQUFPQyxNQUFNLENBQUNDLElBQVAsQ0FBWSxLQUFLeEIsV0FBakIsRUFBOEJ5QixLQUE5QixDQUFvQyxVQUFBQyxRQUFRO0FBQUEsZUFDakQsS0FBSSxDQUFDMUIsV0FBTCxDQUFpQjBCLFFBQWpCLElBQTZCTCxnQkFBZ0IsQ0FBQ0ssUUFBRCxDQUE3QyxHQUEwRCxJQURUO0FBQUEsT0FBNUMsQ0FBUDtBQUdEOzs7Ozs7ZUFHWXJDLGMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY2xvbmVEZWVwIGZyb20gJ2xvZGFzaC9jbG9uZURlZXAnOyAvL1RPRE8gbWF5YmUgZG9uJ3QgdXNlXG5cbmNsYXNzIFNlbGVjdG9yQ29uZmlnIHtcbiAgY29uc3RydWN0b3IobmFtZSwgY29uZmlnKSB7XG4gICAgdGhpcy5uYW1lID0gbmFtZSB8fCAnVW5uYW1lZCBTZWxlY3RvciBDb25maWd1cmF0aW9uJztcbiAgICB0aGlzLmRlZmF1bHRDb21wb3NpdGlvbiA9IHtcbiAgICAgIGNsYXNzZXM6IHRydWUsXG4gICAgICBpZHM6IHRydWUsXG4gICAgICB0YWdzOiB0cnVlLFxuICAgICAgYXR0cmlidXRlczogZmFsc2UsXG4gICAgICBleGNsdWRlUmFuZG9tU2VsZWN0b3JzOiB0cnVlLFxuICAgICAgZXhjZXB0aW9uczoge31cbiAgICB9O1xuXG4gICAgaWYgKCFjb25maWcpIHtcbiAgICAgIHRoaXMudXNlRGVmYXVsdENvbXBvc2l0aW9uKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY29tcG9zaXRpb24gPSB7XG4gICAgICAgIGNsYXNzZXM6IGNvbmZpZy5jbGFzc2VzLFxuICAgICAgICBpZHM6IGNvbmZpZy5pZHMsXG4gICAgICAgIHRhZ3M6IGNvbmZpZy50YWdzLFxuICAgICAgICBhdHRyaWJ1dGVzOiBjb25maWcuYXR0cmlidXRlcyxcbiAgICAgICAgZXhjbHVkZVJhbmRvbVNlbGVjdG9yczogY29uZmlnLmV4Y2x1ZGVSYW5kb21TZWxlY3RvcnMsXG4gICAgICAgIGV4Y2VwdGlvbnM6IGNvbmZpZy5leGNlcHRpb25zLFxuICAgICAgfTtcbiAgICB9XG4gICAgdGhpcy52YWxpZENvbXBvc2l0aW9uUHJvcGVydGllcyA9IFtcbiAgICAgICdjbGFzc2VzJywgJ2F0dHJpYnV0ZXMnLCAnaWRzJywgJ3RhZ3MnLCAnZXhjbHVkZVJhbmRvbVNlbGVjdG9ycycsICdleGNlcHRpb25zJ1xuICAgIF07XG4gIH1cblxuICBtb2RpZnlDb21wb3NpdGlvbihjb21wb3NpdGlvblByb3BlcnR5LCB2YWx1ZSkge1xuICAgIGlmICghdGhpcy52YWxpZENvbXBvc2l0aW9uUHJvcGVydGllcy5pbmNsdWRlcyhjb21wb3NpdGlvblByb3BlcnR5KSkge1xuICAgICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IoJ0ludmFsaWQgY29tcG9zaXRpb24gcHJvcGVydHk6JywgY29tcG9zaXRpb25Qcm9wZXJ0eSk7XG4gICAgfVxuICAgIC8vIHNhdmUgY3VycmVudCBjb21wb3NpdGlvblxuICAgIHRoaXMuc2F2ZUNvbXBvc2l0aW9uKCk7XG4gICAgLy8gY2hhbmdlIGNvbXBvc2l0aW9uXG4gICAgdGhpcy5jb21wb3NpdGlvbltjb21wb3NpdGlvblByb3BlcnR5XSA9IHZhbHVlO1xuICB9XG5cbiAgc2F2ZUNvbXBvc2l0aW9uKCkge1xuICAgIHRoaXMuc2F2ZWRDb21wb3NpdGlvbiA9IGNsb25lRGVlcCh0aGlzLmNvbXBvc2l0aW9uKTtcbiAgfVxuXG4gIGdldENvbXBvc2l0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmNvbXBvc2l0aW9uO1xuICB9XG5cbiAgZ2V0Rm9yYmlkZGVuQ2xhc3NTdWJzdHJpbmdzKCkge1xuICAgIHJldHVybiB0aGlzLmNvbXBvc2l0aW9uLmV4Y2VwdGlvbnMgJiZcbiAgICAgIHRoaXMuY29tcG9zaXRpb24uZXhjZXB0aW9ucy5mb3JiaWRkZW5DbGFzc1N1YnN0cmluZ3MgfHwgW107XG4gIH1cblxuICBnZXRGb3JiaWRkZW5JZFN1YnN0cmluZ3MoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29tcG9zaXRpb24uZXhjZXB0aW9ucyAmJlxuICAgICAgdGhpcy5jb21wb3NpdGlvbi5leGNlcHRpb25zLmZvcmJpZGRlbklkU3Vic3RyaW5ncyB8fCBbXTtcbiAgfVxuXG4gIGdldEZvcmJpZGRlbkF0dHJpYnV0ZVN1YnN0cmluZ3MoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29tcG9zaXRpb24uZXhjZXB0aW9ucyAmJlxuICAgICAgdGhpcy5jb21wb3NpdGlvbi5leGNlcHRpb25zLmZvcmJpZGRlbkF0dHJpYnV0ZVN1YnN0cmluZ3MgfHwgW107XG4gIH1cblxuICBkZWxldGVGb3JiaWRkZW5DbGFzc1N1YnN0cmluZyhzdWJzdHJpbmcpIHtcbiAgICBsZXQgZm9yYmlkZGVuQ2xhc3NTdWJzdHJpbmdzID0gdGhpcy5nZXRGb3JiaWRkZW5DbGFzc1N1YnN0cmluZ3MoKTtcbiAgICBsZXQgaW5kZXggPSBmb3JiaWRkZW5DbGFzc1N1YnN0cmluZ3MuaW5kZXhPZihzdWJzdHJpbmcpO1xuXG4gICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgIHRoaXMuY29tcG9zaXRpb24uZXhjZXB0aW9ucy5mb3JiaWRkZW5DbGFzc1N1YnN0cmluZ3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gIH1cblxuICBkZWxldGVGb3JiaWRkZW5JZFN1YnN0cmluZyhzdWJzdHJpbmcpIHtcbiAgICBsZXQgZm9yYmlkZGVuSWRTdWJzdHJpbmdzID0gdGhpcy5nZXRGb3JiaWRkZW5JZFN1YnN0cmluZ3MoKTtcbiAgICBsZXQgaW5kZXggPSBmb3JiaWRkZW5JZFN1YnN0cmluZ3MuaW5kZXhPZihzdWJzdHJpbmcpO1xuXG4gICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgIHRoaXMuY29tcG9zaXRpb24uZXhjZXB0aW9ucy5mb3JiaWRkZW5JZFN1YnN0cmluZ3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gIH1cblxuICBkZWxldGVGb3JiaWRkZW5BdHRyaWJ1dGVTdWJzdHJpbmcoc3Vic3RyaW5nKSB7XG4gICAgbGV0IGZvcmJpZGRlbkF0dHJpYnV0ZVN1YnN0cmluZ3MgPSB0aGlzLmdldEZvcmJpZGRlbkF0dHJpYnV0ZVN1YnN0cmluZ3MoKTtcbiAgICBsZXQgaW5kZXggPSBmb3JiaWRkZW5BdHRyaWJ1dGVTdWJzdHJpbmdzLmluZGV4T2Yoc3Vic3RyaW5nKTtcblxuICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICB0aGlzLmNvbXBvc2l0aW9uLmV4Y2VwdGlvbnMuZm9yYmlkZGVuQXR0cmlidXRlU3Vic3RyaW5ncy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgfVxuXG4gIGluc2VydEZvcmJpZGRlbkNsYXNzU3Vic3RyaW5nKHN1YnN0cmluZykge1xuICAgIGxldCBmb3JiaWRkZW5DbGFzc1N1YnN0cmluZ3MgPSB0aGlzLmdldEZvcmJpZGRlbkNsYXNzU3Vic3RyaW5ncygpO1xuXG4gICAgZm9yYmlkZGVuQ2xhc3NTdWJzdHJpbmdzLnB1c2goc3Vic3RyaW5nKTtcbiAgICB0aGlzLmNvbXBvc2l0aW9uLmV4Y2VwdGlvbnMuZm9yYmlkZGVuQ2xhc3NTdWJzdHJpbmdzID1cbiAgICAgIGZvcmJpZGRlbkNsYXNzU3Vic3RyaW5ncztcbiAgfVxuXG4gIGluc2VydEZvcmJpZGRlbklkU3Vic3RyaW5nKHN1YnN0cmluZykge1xuICAgIGxldCBmb3JiaWRkZW5JZFN1YnN0cmluZ3MgPSB0aGlzLmdldEZvcmJpZGRlbklkU3Vic3RyaW5ncygpO1xuXG4gICAgZm9yYmlkZGVuSWRTdWJzdHJpbmdzLnB1c2goc3Vic3RyaW5nKTtcbiAgICB0aGlzLmNvbXBvc2l0aW9uLmV4Y2VwdGlvbnMuZm9yYmlkZGVuSWRTdWJzdHJpbmdzID1cbiAgICAgIGZvcmJpZGRlbklkU3Vic3RyaW5ncztcbiAgfVxuXG4gIGluc2VydEZvcmJpZGRlbkF0dHJpYnV0ZVN1YnN0cmluZyhzdWJzdHJpbmcpIHtcbiAgICBsZXQgZm9yYmlkZGVuQXR0cmlidXRlU3Vic3RyaW5ncyA9IHRoaXMuZ2V0Rm9yYmlkZGVuQXR0cmlidXRlU3Vic3RyaW5ncygpO1xuXG4gICAgZm9yYmlkZGVuQXR0cmlidXRlU3Vic3RyaW5ncy5wdXNoKHN1YnN0cmluZyk7XG4gICAgdGhpcy5jb21wb3NpdGlvbi5leGNlcHRpb25zLmZvcmJpZGRlbkF0dHJpYnV0ZVN1YnN0cmluZ3MgPVxuICAgICAgZm9yYmlkZGVuQXR0cmlidXRlU3Vic3RyaW5ncztcbiAgfVxuXG4gIHJlc3RvcmVTYXZlZENvbXBvc2l0aW9uKCkge1xuICAgIHRoaXMuY29tcG9zaXRpb24gPSBjbG9uZURlZXAodGhpcy5zYXZlZENvbXBvc2l0aW9uKTtcbiAgfVxuXG4gIHVzZURlZmF1bHRDb21wb3NpdGlvbigpIHtcbiAgICB0aGlzLmNvbXBvc2l0aW9uID0gY2xvbmVEZWVwKHRoaXMuZGVmYXVsdENvbXBvc2l0aW9uKTtcbiAgfVxuXG4gIGlzQWxsb3dJZHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29tcG9zaXRpb24uaWRzO1xuICB9XG5cbiAgaXNBbGxvd0NsYXNzZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29tcG9zaXRpb24uY2xhc3NlcztcbiAgfVxuXG4gIGlzQWxsb3dBdHRyaWJ1dGVzKCkge1xuICAgIHJldHVybiB0aGlzLmNvbXBvc2l0aW9uLmF0dHJpYnV0ZXM7XG4gIH1cblxuICBpc0FsbG93VGFncygpIHtcbiAgICByZXR1cm4gdGhpcy5jb21wb3NpdGlvbi50YWdzO1xuICB9XG5cbiAgaXNFeGNsdWRpbmdSYW5kb21TZWxlY3RvcnMoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29tcG9zaXRpb24uZXhjbHVkZVJhbmRvbVNlbGVjdG9ycztcbiAgfVxuXG4gIGlzQ29tcG9zaXRpb25WYWxpZCgpIHtcbiAgICBsZXQge2lkcywgY2xhc3NlcywgdGFncywgYXR0cmlidXRlc30gPSB0aGlzLmNvbXBvc2l0aW9uO1xuXG4gICAgcmV0dXJuIGlkcyB8fCBjbGFzc2VzIHx8IHRhZ3MgfHwgYXR0cmlidXRlcztcbiAgfVxuXG4gIGNsb25lKCkge1xuICAgIHJldHVybiBuZXcgU2VsZWN0b3JDb25maWcodGhpcy5uYW1lLCBjbG9uZURlZXAodGhpcy5jb21wb3NpdGlvbikpO1xuICB9XG5cbiAgaXNJbmNsdWRlZEluQ29uZmlnKG90aGVyQ29uZmlnKSB7XG4gICAgY29uc3Qgb3RoZXJDb21wb3NpdGlvbiA9IG90aGVyQ29uZmlnLmdldENvbXBvc2l0aW9uKCk7XG5cbiAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5jb21wb3NpdGlvbikuZXZlcnkocHJvcGVydHkgPT5cbiAgICAgIHRoaXMuY29tcG9zaXRpb25bcHJvcGVydHldID8gb3RoZXJDb21wb3NpdGlvbltwcm9wZXJ0eV0gOiB0cnVlXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBTZWxlY3RvckNvbmZpZztcbiJdLCJmaWxlIjoic2VsZWN0b3ItZ2VuZXJhdGlvbi9zZWxlY3Rvci1jb25maWd1cmF0aW9uLmpzIn0=
