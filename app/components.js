const react = require('react');
const e = react.createElement;

class Requirement extends react.Component {
  constructor(props) {
    super(props);
    this.state =
    {
      checked: this.props.checked || false
    };
  }

  toggleChange = () => {
    this.setState({
      checked: !this.state.checked,
    });
  }

  render() {
    return ([
      e("label", {key: this.props.value + "label", id: this.props.value + "Label", htmlFor: this.props.value}, this.props.value),
      e("input", {key: this.props.value + "input", className: "checkReq", name: this.props.value, type: "checkbox", id: this.props.value, checked: this.state.checked, onChange: this.toggleChange}, null)
    ]);
  }
}

class Goal extends react.Component {
  render() {
    var list = [];
    react.Children.map(this.props.reqs, item => {
      list.push(e("li", {key: item}, item));
    });

    return (
      e('div', {className: 'notification is-link is-light goal'},
        e('h2', {className: 'title is-uppercase is-size-5'}, this.props.title),
        e('p', {className: 'desc'}, this.props.desc),
        e('ul', {className: 'reqList subtitle is-size-6 is-uppercase'}, list),
        e('input', {className: 'editButton button is-danger', type: 'button', value: 'Edit'}, null),
        e('input', {className: 'doneButton button', type: 'button', value: 'Complete'}, null),
        e('button', {className: "delete deleteGoal"}, null)
      )
    );
  }
}

class Timer extends react.Component {
  render() {
    return (
      e('div', {className: 'notification is-link is-light timer'},
        e('h2', {className: 'title is-uppercase is-size-5'}, this.props.title),
        e('button', {className: "delete deleteTimer"}, null),
        e('p', {className: 'subtitle is-size-6 time'}, this.props.time),
        e('p', {className: 'subtitle is-size-6 until'}, this.props.until),
        e('p', {className: 'desc'}, this.props.desc),
        e('input', {className: 'editTimer button is-danger', type: 'button', value: 'Edit'}, null)
      )
    );
  }
}

class Modal extends react.Component {
  constructor(props) {
    super(props);
    this.state =
    {
      title: this.props.title || "",
      desc: this.props.desc || "",
      date: this.props.date || "",
      time: this.props.time || "",
    };
  }

  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  render() {
    var goalForm = [
      e('label', {htmlFor: "skillText", key: "skillTextLabel"}, "Title"),
      e('input', {type: "text", id: "skillText", className: "input is-primary", key: "skillTextInput", name: "title", value: this.state.title, onChange: this.handleChange.bind(this)}, null),
      e('p', {className: "errors", key: "titleError"}, null),
      e('label', {htmlFor: "descText", key: "descTextLabel"}, "Description"),
      e('textarea', {id: "descText", key: "descTextInput", name: "desc", value: this.state.desc, onChange: this.handleChange.bind(this)}, null),
      e('label', {key: "requireListLabel"}, "Requirements"),
      this.props.requirements
    ];

    var timerForm = [
      e('label', {htmlFor: "timerTitle", key: "timerTitleLabel"}, "Title"),
      e('input', {type: "text", id: "timerTitle", name: "title", className: "input is-primary", key: "timerTitleInput", value: this.state.title, onChange: this.handleChange.bind(this)}, null),
      e('p', {className: "errors", key: "titleError"}, null),
      e('label', {htmlFor: "timerDate", key: "timerDateLabel"}, "Date"),
      e('input', {type: "date", id: "timerDate", name: "date", className: "input is-primary", key: "timerDateInput", value: this.state.date, onChange: this.handleChange.bind(this)}, null),
      e('label', {htmlFor: "timerTime", key: "timerTimeLabel"}, "Time"),
      e('input', {type: "time", id: "timerTime", name: "time", className: "input is-primary", key: "timerTimeInput", value: this.state.time, onChange: this.handleChange.bind(this)}, null),
      e('label', {htmlFor: "timerDesc", key: "timerDescLabel"}, "Description"),
      e('textarea', {id: "timerDesc", key: "timerDescInput", name: "desc", value: this.state.desc, onChange: this.handleChange.bind(this)}, null)
    ];

    var form = Array.isArray(this.props.requirements) ? goalForm : timerForm;

    return (
      e('div', {className: 'modal fade', id: this.props.type + "Modal", role: "dialog"},
        e('div', {className: "modal-dialog modal-dialog-centered"},
          e('div', {className: "modal-content"},
            e('div', {className: "modal-header"},
              e('h4', {className: "modal-title"}, this.props.header)
            ),
            e('div', {className: "modal-body"},
              e('form', {className: "addForm", id: this.props.type + "Form"},
                form
              )
            ),
            e('div', {className: "modal-footer"},
              e('button', {id: this.props.type + "Save", type: "button", className: "btn btn-default saveButton"}, "Save"),
              e('button', {id: this.props.type + "Close", type: "button", className: "btn btn-default", "data-dismiss": "modal"}, "Close")
            )
          )
        )
      )
    );
  }
}

module.exports = {Goal: Goal, Timer: Timer, Requirement: Requirement, Modal: Modal};
