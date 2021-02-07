const react = require('react');
const rd = require('react-dom');
const moment = require('moment')
const e = react.createElement;

class Goal extends react.Component {
  render() {
    var list = [];
    react.Children.map(this.props.reqs, item => {
      list.push(e("li", {key: item},
        item, e('input', {className: "removeButton hidden", type: "button", value: "Remove requirement"}, null)
      ));
    });
    var select = this.props.select.length != 0 ?
      [e('div', {className: "requireDiv select is-primary", key: "div"}, e('select', {name: "require"}, this.props.select)),
      e('input', {className: "addReqEdit button is-danger", type: "button", value: "Confirm Edit", key: "input"}, null)]
      : null;

    return e('div', {className: 'notification is-link is-light goal'},
             e('h2', {className: 'title is-uppercase is-size-5'}, `${this.props.title}`),
             e('p', {className: 'desc'}, `${this.props.desc}`),
             e('ul', {className: 'reqList subtitle is-size-6 is-uppercase'}, list),
             e('input', {className: 'editButton button is-danger', type: 'button', value: 'Edit'}, null),
             e('input', {className: 'doneButton button', type: 'button', value: 'Complete'}, null),
             e('div', {className: "hidden editSelect"},
               select,
               e('input', {className: "cancelButton button is-danger", type: "button", value: "Cancel"}, null)
              ),
             e('button', {className: "delete deleteButton hidden"}, null)
            );
  }
}

class Timer extends react.Component {
  render() {
    var d = moment(new Date(this.props.time)).format("ddd MMM Do [at] HH:mm");
    var u = moment(d, "ddd MMM Do [at] HH:mm").fromNow();

    return e('div', {className: 'notification is-link is-light timer'},
              e('h2', {className: 'title is-uppercase is-size-5'}, `${this.props.title}`),
              e('button', {className: "delete deleteButton hidden"}, null),
              e('div', {className: "timerInfo"},
                e('p', {className: 'subtitle is-size-6 time'}, d.toString()),
                e('p', {className: 'subtitle is-size-6 until'}, u.toString()),
                e('input', {className: 'editTimer button is-danger', type: 'button', value: 'Edit'}, null)
              ),
              e('div', {className: "hidden editDiv"},
                e('input', {type: "date", className: "input is-primary editDate", required: true}, null),
                e('input', {type: "time", className: "input is-primary editTime", required: true}, null),
                e('input', {type: "button", className: "button is-primary editTimerSubmit", value: "Add"}, null),
                e('input', {type: "button", className: "button is-danger editTimerCancel", value: "Cancel"}, null)
              )
            );
  }
}

module.exports = {Goal: Goal, Timer: Timer};
