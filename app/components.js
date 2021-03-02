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
      e("button", {key: this.props.value + "button", className: "button reqButton", type: "button"}, this.props.value)
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
      e('div', {className: 'card goal'},
        e('header', {className: 'card-header'},
          e('h2', {className: 'title is-uppercase is-size-5'}, this.props.title)
        ),
        e('div', {className: 'card-content'},
          e('div', {className: 'content'},
            e('p', {className: 'desc'}, this.props.desc),
            e('ul', {className: 'reqList subtitle is-size-6 is-uppercase'}, list)
          )
        ),
        e('footer', {className: 'card-footer'},
          e('a', {className: 'editButton card-footer-item'}, "Edit"),
          e('a', {className: 'doneButton card-footer-item'}, "Complete"),
          e('a', {className: "deleteGoal card-footer-item"}, "Delete")
        )
      )
    );
  }
}

class Timer extends react.Component {
  render() {
    return (
      e('div', {className: 'card timer'},
        e('header', {className: 'card-header'},
          e('h2', {className: 'title is-uppercase is-size-5'}, this.props.title)
        ),
        e('div', {className: 'card-content'},
          e('p', {className: 'subtitle is-size-6 time'}, this.props.time),
          e('p', {className: 'subtitle is-size-6 until'}, this.props.until),
          e('p', {className: 'desc'}, this.props.desc)
        ),
        e('footer', {className: 'card-footer'},
          e('a', {className: 'editTimer card-footer-item'}, "Edit"),
          e('a', {className: "deleteTimer card-footer-item"}, "Delete")
        )
      )
    );
  }
}

class Message extends react.Component {
  render() {
    // formatting for the contents of the message
    var messageBody = []
    var i;
    var space = ", ";
    var len = this.props.titles.length;
    for (i = 0; i < len - 1; i++) {
      if (i == len - 2) {
        space = " ";
      }
      messageBody.push(e('span', {key: this.props.titles[i], className: "spanText"}, this.props.titles[i]));
      messageBody.push(e('span', {key: "space" + i}, space));
    }
    if (len > 1) {
      messageBody.push(e('span', {key: "space" + i}, "and "));
    }
    messageBody.push(e('span', {key: this.props.titles[i], className: "spanText"}, this.props.titles[i]));
    var title = len == 1 ? "1 timer has gone off." : this.props.titles.length + " timers have gone off."
    var messageEnd = len == 1 ? " is ready. " : " are ready.";

    return (
      e('article', {className: 'message'},
        e('div', {className: 'message-header'},
          e('p', {className: 'messageTitle'}, title),
          e('button', {className: 'delete closeMessage'}, null)
        ),
        e('div', {className: 'message-body'},
          e('p', {className: 'messageText'}, messageBody, messageEnd)
        )
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
      e('input', {type: "text", id: "descText", className: "input is-primary", key: "descTextInput", name: "desc", value: this.state.desc, onChange: this.handleChange.bind(this)}, null),
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
      e('input', {type: "text", id: "timerDesc", className: "input is-primary", key: "timerDescInput", name: "desc", value: this.state.desc, onChange: this.handleChange.bind(this)}, null)
    ];

    var form = Array.isArray(this.props.requirements) ? goalForm : timerForm;

    return (
      e('div', {className: 'modal', id: this.props.type + "Modal"},
        e('div', {className: 'modal-background'}, null),
        e('div', {className: 'modal-card'},
          e('header', {className: 'modal-card-head'},
            e('h2', {className: "modal-title"}, this.props.header)
          ),
          e('section', {className: 'modal-card-body'},
            e('div', {className: 'content'},
              e('form', {className: "addForm", id: this.props.type + "Form"},
                form
              )
            )
          ),
          e('footer', {className: 'modal-card-foot'},
            e('button', {id: this.props.type + "Save", className: "button is-success saveButton"}, "Save"),
            e('button', {id: this.props.type + "Close", className: "button closeModal"}, "Close")
          )
        ),
      )
    );
  }
}

module.exports = {Goal: Goal, Timer: Timer, Requirement: Requirement, Modal: Modal, Message: Message};
