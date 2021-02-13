const react = require('react');
const rd = require('react-dom');
const moment = require('moment')
const e = react.createElement;

class Requirement extends react.Component {
  constructor(props) {
    super(props);
    this.state =
    {
      checked: this.props.checked
    };
  }

  toggleChange = () => {
    this.setState({
      checked: !this.state.checked,
    });
  }

  render() {
    return ([
      e("label", {key: `${this.props.value}` + "label", htmlFor: `${this.props.value}`}, `${this.props.value}`),
      e("input", {key: `${this.props.value}` + "input", className: "checkReq", name: `${this.props.value}`, type: "checkbox", id: `${this.props.value}`, checked: this.state.checked, onChange: this.toggleChange}, null)
    ]);
  }
}

class Goal extends react.Component {
  render() {
    var list = [];
    react.Children.map(this.props.reqs, item => {
      list.push(e("li", {key: item},
        item, e('input', {className: "removeButton hidden", type: "button", value: "Remove requirement"}, null)
      ));
    });

    return (
      e('div', {className: 'notification is-link is-light goal'},
        e('h2', {className: 'title is-uppercase is-size-5'}, `${this.props.title}`),
        e('p', {className: 'desc'}, `${this.props.desc}`),
        e('ul', {className: 'reqList subtitle is-size-6 is-uppercase'}, list),
        e('input', {className: 'editButton button is-danger', type: 'button', value: 'Edit'}, null),
        e('input', {className: 'doneButton button', type: 'button', value: 'Complete'}, null),
        e('button', {className: "delete deleteButton"}, null)
      )
    );
  }
}

class Timer extends react.Component {
  render() {
    var d = moment(new Date(this.props.time)).format("ddd MMM Do [at] HH:mm");
    var u = moment(d, "ddd MMM Do [at] HH:mm").fromNow();

    return (
      e('div', {className: 'notification is-link is-light timer'},
        e('h2', {className: 'title is-uppercase is-size-5'}, `${this.props.title}`),
        e('button', {className: "delete deleteButton hidden"}, null),
        e('div', {className: "timerInfo shown"},
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
      )
    )
  }
}

class Modal extends react.Component {
  constructor(props) {
    super(props);
    this.state =
    {
      title: this.props.title,
      desc: this.props.desc
    };
  }

  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  render() {
    var goalForm = [
      e('label', {htmlFor: "skillText", key: "skillTextLabel"}, "Title"),
      e('input', {type: "text", id: "skillText", className: "input is-primary", key: "skillTextInput", name: "title", value: `${this.state.title}`, onChange: this.handleChange.bind(this)}, null),
      e('label', {htmlFor: "descText", key: "descTextLabel"}, "Description"),
      e('textarea', {id: "descText", key: "descTextInput", name: "desc", value: `${this.state.desc}`, onChange: this.handleChange.bind(this)}, null),
      e('label', {key: "requireListLabel"}, "Requirements"),
      this.props.requirements
    ];

    var timerForm = [
      e('label', {htmlFor: "timerTitle", key: "timerTitleLabel"}, "Title"),
      e('input', {type: "text", id: "timerTitle", className: "input is-primary", key: "timerTitleInput"}, null),
      e('label', {htmlFor: "timerDate", key: "timerDateLabel"}, "Date"),
      e('input', {type: "date", id: "timerDate", className: "input is-primary", key: "timerDateInput"}, null),
      e('label', {htmlFor: "timerTime", key: "timerTimeLabel"}, "Time"),
      e('input', {type: "time", id: "timerTime", className: "input is-primary", key: "timerTimeInput"}, null),
    ];

    var form = Array.isArray(this.props.requirements) ? goalForm : timerForm;

    return (
      e('div', {className: 'modal', id: `${this.props.type}` + "Modal", role: "dialog"},
        e('div', {className: "modal-dialog"},
          e('div', {className: "modal-content"},
            e('div', {className: "modal-header"},
              e('h4', {className: "modal-title"}, `${this.props.header}`)
            ),
            e('div', {className: "modal-body"},
              e('form', {className: "addForm", id: `${this.props.type}` + "Form"},
                form
              )
            ),
            e('div', {className: "modal-footer"},
              e('button', {id: `${this.props.type}` + "Save", type: "button", className: "btn btn-default", "data-dismiss": "modal"}, "Save"),
              e('button', {id: `${this.props.type}` + "Close", type: "button", className: "btn btn-default", "data-dismiss": "modal"}, "Close")
            )
          )
        )
      )
    );
  }
}

module.exports = {Goal: Goal, Timer: Timer, Requirement: Requirement, Modal: Modal};
