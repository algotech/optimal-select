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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNlbGVjdG9yLWdlbmVyYXRpb24vc2VsZWN0b3ItY29uZmlndXJhdGlvbi5qcyJdLCJuYW1lcyI6WyJTZWxlY3RvckNvbmZpZyIsIm5hbWUiLCJjb25maWciLCJkZWZhdWx0Q29tcG9zaXRpb24iLCJjbGFzc2VzIiwiaWRzIiwidGFncyIsImF0dHJpYnV0ZXMiLCJleGNsdWRlUmFuZG9tU2VsZWN0b3JzIiwiZXhjZXB0aW9ucyIsInVzZURlZmF1bHRDb21wb3NpdGlvbiIsImNvbXBvc2l0aW9uIiwidmFsaWRDb21wb3NpdGlvblByb3BlcnRpZXMiLCJjb21wb3NpdGlvblByb3BlcnR5IiwidmFsdWUiLCJpbmNsdWRlcyIsImNvbnNvbGUiLCJlcnJvciIsInNhdmVDb21wb3NpdGlvbiIsInNhdmVkQ29tcG9zaXRpb24iLCJmb3JiaWRkZW5DbGFzc1N1YnN0cmluZ3MiLCJmb3JiaWRkZW5BdHRyaWJ1dGVTdWJzdHJpbmdzIiwic3Vic3RyaW5nIiwiZ2V0Rm9yYmlkZGVuQ2xhc3NTdWJzdHJpbmdzIiwiaW5kZXgiLCJpbmRleE9mIiwic3BsaWNlIiwiZ2V0Rm9yYmlkZGVuQXR0cmlidXRlU3Vic3RyaW5ncyIsInB1c2giLCJvdGhlckNvbmZpZyIsIm90aGVyQ29tcG9zaXRpb24iLCJnZXRDb21wb3NpdGlvbiIsIk9iamVjdCIsImtleXMiLCJldmVyeSIsInByb3BlcnR5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7Ozs7Ozs7Ozs7QUFBMEM7SUFFcENBLGM7QUFDSiwwQkFBWUMsSUFBWixFQUFrQkMsTUFBbEIsRUFBMEI7QUFBQTs7QUFDeEIsU0FBS0QsSUFBTCxHQUFZQSxJQUFJLElBQUksZ0NBQXBCO0FBQ0EsU0FBS0Usa0JBQUwsR0FBMEI7QUFDeEJDLE1BQUFBLE9BQU8sRUFBRSxJQURlO0FBRXhCQyxNQUFBQSxHQUFHLEVBQUUsSUFGbUI7QUFHeEJDLE1BQUFBLElBQUksRUFBRSxJQUhrQjtBQUl4QkMsTUFBQUEsVUFBVSxFQUFFLEtBSlk7QUFLeEJD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QUE2QkwsZ0JBQWdCLENBQUNLLFFBQUQsQ0FBN0MsR0FBMEQsSUFEVDtBQUFBLE9BQTVDLENBQVA7QUFHRDs7Ozs7O2VBR1luQyxjIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNsb25lRGVlcCBmcm9tICdsb2Rhc2gvY2xvbmVEZWVwJzsgLy9UT0RPIG1heWJlIGRvbid0IHVzZVxuXG5jbGFzcyBTZWxlY3RvckNvbmZpZyB7XG4gIGNvbnN0cnVjdG9yKG5hbWUsIGNvbmZpZykge1xuICAgIHRoaXMubmFtZSA9IG5hbWUgfHwgJ1VubmFtZWQgU2VsZWN0b3IgQ29uZmlndXJhdGlvbic7XG4gICAgdGhpcy5kZWZhdWx0Q29tcG9zaXRpb24gPSB7XG4gICAgICBjbGFzc2VzOiB0cnVlLFxuICAgICAgaWRzOiB0cnVlLFxuICAgICAgdGFnczogdHJ1ZSxcbiAgICAgIGF0dHJpYnV0ZXM6IGZhbHNlLFxuICAgICAgZXhjbHVkZVJhbmRvbVNlbGVjdG9yczogdHJ1ZSxcbiAgICAgIGV4Y2VwdGlvbnM6IHt9XG4gICAgfTtcblxuICAgIGlmICghY29uZmlnKSB7XG4gICAgICB0aGlzLnVzZURlZmF1bHRDb21wb3NpdGlvbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNvbXBvc2l0aW9uID0ge1xuICAgICAgICBjbGFzc2VzOiBjb25maWcuY2xhc3NlcyxcbiAgICAgICAgaWRzOiBjb25maWcuaWRzLFxuICAgICAgICB0YWdzOiBjb25maWcudGFncyxcbiAgICAgICAgYXR0cmlidXRlczogY29uZmlnLmF0dHJpYnV0ZXMsXG4gICAgICAgIGV4Y2x1ZGVSYW5kb21TZWxlY3RvcnM6IGNvbmZpZy5leGNsdWRlUmFuZG9tU2VsZWN0b3JzLFxuICAgICAgICBleGNlcHRpb25zOiBjb25maWcuZXhjZXB0aW9ucyxcbiAgICAgIH07XG4gICAgfVxuICAgIHRoaXMudmFsaWRDb21wb3NpdGlvblByb3BlcnRpZXMgPSBbXG4gICAgICAnY2xhc3NlcycsICdhdHRyaWJ1dGVzJywgJ2lkcycsICd0YWdzJywgJ2V4Y2x1ZGVSYW5kb21TZWxlY3RvcnMnLCAnZXhjZXB0aW9ucydcbiAgICBdO1xuICB9XG5cbiAgbW9kaWZ5Q29tcG9zaXRpb24oY29tcG9zaXRpb25Qcm9wZXJ0eSwgdmFsdWUpIHtcbiAgICBpZiAoIXRoaXMudmFsaWRDb21wb3NpdGlvblByb3BlcnRpZXMuaW5jbHVkZXMoY29tcG9zaXRpb25Qcm9wZXJ0eSkpIHtcbiAgICAgIHJldHVybiBjb25zb2xlLmVycm9yKCdJbnZhbGlkIGNvbXBvc2l0aW9uIHByb3BlcnR5OicsIGNvbXBvc2l0aW9uUHJvcGVydHkpO1xuICAgIH1cbiAgICAvLyBzYXZlIGN1cnJlbnQgY29tcG9zaXRpb25cbiAgICB0aGlzLnNhdmVDb21wb3NpdGlvbigpO1xuICAgIC8vIGNoYW5nZSBjb21wb3NpdGlvblxuICAgIHRoaXMuY29tcG9zaXRpb25bY29tcG9zaXRpb25Qcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgfVxuXG4gIHNhdmVDb21wb3NpdGlvbigpIHtcbiAgICB0aGlzLnNhdmVkQ29tcG9zaXRpb24gPSBjbG9uZURlZXAodGhpcy5jb21wb3NpdGlvbik7XG4gIH1cblxuICBnZXRDb21wb3NpdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5jb21wb3NpdGlvbjtcbiAgfVxuXG4gIGdldEZvcmJpZGRlbkNsYXNzU3Vic3RyaW5ncygpIHtcbiAgICByZXR1cm4gdGhpcy5jb21wb3NpdGlvbi5leGNlcHRpb25zICYmXG4gICAgICB0aGlzLmNvbXBvc2l0aW9uLmV4Y2VwdGlvbnMuZm9yYmlkZGVuQ2xhc3NTdWJzdHJpbmdzIHx8IFtdO1xuICB9XG5cbiAgZ2V0Rm9yYmlkZGVuQXR0cmlidXRlU3Vic3RyaW5ncygpIHtcbiAgICByZXR1cm4gdGhpcy5jb21wb3NpdGlvbi5leGNlcHRpb25zICYmXG4gICAgICB0aGlzLmNvbXBvc2l0aW9uLmV4Y2VwdGlvbnMuZm9yYmlkZGVuQXR0cmlidXRlU3Vic3RyaW5ncyB8fCBbXTtcbiAgfVxuXG4gIGRlbGV0ZUZvcmJpZGRlbkNsYXNzU3Vic3RyaW5nKHN1YnN0cmluZykge1xuICAgIGxldCBmb3JiaWRkZW5DbGFzc1N1YnN0cmluZ3MgPSB0aGlzLmdldEZvcmJpZGRlbkNsYXNzU3Vic3RyaW5ncygpO1xuICAgIGxldCBpbmRleCA9IGZvcmJpZGRlbkNsYXNzU3Vic3RyaW5ncy5pbmRleE9mKHN1YnN0cmluZyk7XG5cbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgdGhpcy5jb21wb3NpdGlvbi5leGNlcHRpb25zLmZvcmJpZGRlbkNsYXNzU3Vic3RyaW5ncy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgfVxuXG4gIGRlbGV0ZUZvcmJpZGRlbkF0dHJpYnV0ZVN1YnN0cmluZyhzdWJzdHJpbmcpIHtcbiAgICBsZXQgZm9yYmlkZGVuQXR0cmlidXRlU3Vic3RyaW5ncyA9IHRoaXMuZ2V0Rm9yYmlkZGVuQXR0cmlidXRlU3Vic3RyaW5ncygpO1xuICAgIGxldCBpbmRleCA9IGZvcmJpZGRlbkF0dHJpYnV0ZVN1YnN0cmluZ3MuaW5kZXhPZihzdWJzdHJpbmcpO1xuXG4gICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgIHRoaXMuY29tcG9zaXRpb24uZXhjZXB0aW9ucy5mb3JiaWRkZW5BdHRyaWJ1dGVTdWJzdHJpbmdzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICB9XG5cbiAgaW5zZXJ0Rm9yYmlkZGVuQ2xhc3NTdWJzdHJpbmcoc3Vic3RyaW5nKSB7XG4gICAgbGV0IGZvcmJpZGRlbkNsYXNzU3Vic3RyaW5ncyA9IHRoaXMuZ2V0Rm9yYmlkZGVuQ2xhc3NTdWJzdHJpbmdzKCk7XG5cbiAgICBmb3JiaWRkZW5DbGFzc1N1YnN0cmluZ3MucHVzaChzdWJzdHJpbmcpO1xuICAgIHRoaXMuY29tcG9zaXRpb24uZXhjZXB0aW9ucy5mb3JiaWRkZW5DbGFzc1N1YnN0cmluZ3MgPVxuICAgICAgZm9yYmlkZGVuQ2xhc3NTdWJzdHJpbmdzO1xuICB9XG5cbiAgaW5zZXJ0Rm9yYmlkZGVuQXR0cmlidXRlU3Vic3RyaW5nKHN1YnN0cmluZykge1xuICAgIGxldCBmb3JiaWRkZW5BdHRyaWJ1dGVTdWJzdHJpbmdzID0gdGhpcy5nZXRGb3JiaWRkZW5BdHRyaWJ1dGVTdWJzdHJpbmdzKCk7XG5cbiAgICBmb3JiaWRkZW5BdHRyaWJ1dGVTdWJzdHJpbmdzLnB1c2goc3Vic3RyaW5nKTtcbiAgICB0aGlzLmNvbXBvc2l0aW9uLmV4Y2VwdGlvbnMuZm9yYmlkZGVuQXR0cmlidXRlU3Vic3RyaW5ncyA9XG4gICAgICBmb3JiaWRkZW5BdHRyaWJ1dGVTdWJzdHJpbmdzO1xuICB9XG5cbiAgcmVzdG9yZVNhdmVkQ29tcG9zaXRpb24oKSB7XG4gICAgdGhpcy5jb21wb3NpdGlvbiA9IGNsb25lRGVlcCh0aGlzLnNhdmVkQ29tcG9zaXRpb24pO1xuICB9XG5cbiAgdXNlRGVmYXVsdENvbXBvc2l0aW9uKCkge1xuICAgIHRoaXMuY29tcG9zaXRpb24gPSBjbG9uZURlZXAodGhpcy5kZWZhdWx0Q29tcG9zaXRpb24pO1xuICB9XG5cbiAgaXNBbGxvd0lkcygpIHtcbiAgICByZXR1cm4gdGhpcy5jb21wb3NpdGlvbi5pZHM7XG4gIH1cblxuICBpc0FsbG93Q2xhc3NlcygpIHtcbiAgICByZXR1cm4gdGhpcy5jb21wb3NpdGlvbi5jbGFzc2VzO1xuICB9XG5cbiAgaXNBbGxvd0F0dHJpYnV0ZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29tcG9zaXRpb24uYXR0cmlidXRlcztcbiAgfVxuXG4gIGlzQWxsb3dUYWdzKCkge1xuICAgIHJldHVybiB0aGlzLmNvbXBvc2l0aW9uLnRhZ3M7XG4gIH1cblxuICBpc0V4Y2x1ZGluZ1JhbmRvbVNlbGVjdG9ycygpIHtcbiAgICByZXR1cm4gdGhpcy5jb21wb3NpdGlvbi5leGNsdWRlUmFuZG9tU2VsZWN0b3JzO1xuICB9XG5cbiAgaXNDb21wb3NpdGlvblZhbGlkKCkge1xuICAgIGxldCB7aWRzLCBjbGFzc2VzLCB0YWdzLCBhdHRyaWJ1dGVzfSA9IHRoaXMuY29tcG9zaXRpb247XG5cbiAgICByZXR1cm4gaWRzIHx8IGNsYXNzZXMgfHwgdGFncyB8fCBhdHRyaWJ1dGVzO1xuICB9XG5cbiAgY2xvbmUoKSB7XG4gICAgcmV0dXJuIG5ldyBTZWxlY3RvckNvbmZpZyh0aGlzLm5hbWUsIGNsb25lRGVlcCh0aGlzLmNvbXBvc2l0aW9uKSk7XG4gIH1cblxuICBpc0luY2x1ZGVkSW5Db25maWcob3RoZXJDb25maWcpIHtcbiAgICBjb25zdCBvdGhlckNvbXBvc2l0aW9uID0gb3RoZXJDb25maWcuZ2V0Q29tcG9zaXRpb24oKTtcblxuICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmNvbXBvc2l0aW9uKS5ldmVyeShwcm9wZXJ0eSA9PlxuICAgICAgdGhpcy5jb21wb3NpdGlvbltwcm9wZXJ0eV0gPyBvdGhlckNvbXBvc2l0aW9uW3Byb3BlcnR5XSA6IHRydWVcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNlbGVjdG9yQ29uZmlnO1xuIl0sImZpbGUiOiJzZWxlY3Rvci1nZW5lcmF0aW9uL3NlbGVjdG9yLWNvbmZpZ3VyYXRpb24uanMifQ==
