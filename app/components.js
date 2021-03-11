const React = require('react');
const e = React.createElement;

class Requirement extends React.Component {
  constructor(props) {
    super(props);
    this.state =
    {
      checked: this.props.checked || false,
      color: this.props.checked ? "#3e8ed0" : "white"
    };
  }

  toggleChange = () => {
    this.setState({
      checked: !this.state.checked,
      color: this.state.checked ? "white" : "#3e8ed0"
    });
  }

  render() {
    return ([
      // e('label', {key: this.props.value + "label", className: "checkLabel button", htmlFor: this.props.value, style: {backgroundColor: this.state.color}},
      //   e("input", {key: this.props.value + "input", className: "checkReq", name: this.props.name, type: this.props.type, id: this.props.value, checked: this.state.checked, onChange: this.toggleChange}, null),
      //   this.props.value
      // )
      e("input", {key: this.props.value + "input", className: "checkReq", name: this.props.name, type: this.props.type, id: this.props.value + "ReqInput", defaultChecked: this.props.checked, value: this.props.value}, null),
      e('label', {key: this.props.value + "label", className: "checkLabel button", htmlFor: this.props.value + "ReqInput"}, this.props.label)
    ]);
  }
}

class Goal extends React.Component {
  render() {
    var list = [];
    React.Children.map(this.props.reqs, item => {
      list.push(e("li", {key: item}, item));
    });

    return (
      e('div', {className: 'card goal'},
        e('div', {className: 'topColor', style: {backgroundImage: 'linear-gradient(' + this.props.gradient +  ')'}}, null),
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

class GoalModal extends React.Component {
  constructor(props) {
    super(props);
    this.state =
    {
      title: this.props.title || "",
      desc: this.props.desc || "",
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

    return e(Modal, {type: this.props.type, header: this.props.header, form: goalForm})
  }
}

class Timer extends React.Component {
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

class TimerModal extends React.Component {
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

    return e(Modal, {type: this.props.type, header: this.props.header, form: timerForm})
  }
}

class AccountModal extends React.Component {
  constructor(props) {
    super(props);
    this.state =
    {
      name: this.props.title || "",
    };
  }

  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  render() {
    var accountForm = [
      e('label', {htmlFor: "accountName", key: "accountNameLabel"}, "Name"),
      e('input', {type: "text", id: "accountName", name: "name", className: "input is-primary", key: "accountNameInput", value: this.state.title, onChange: this.handleChange.bind(this)}, null),
      e('p', {className: "errors", key: "titleError"}, null)
    ];

    return e(Modal, {type: this.props.type, header: this.props.header, form: accountForm})
  }
}

class SwitchAccountModal extends React.Component {
  render() {
    var accountReqs = [];
    this.props.accounts.forEach(function(account) {
      accountReqs.push(
        e(Requirement, {key: account.name, value: account.name, checked: account.main == 0 ? false : true, type: "radio", name: "account", label: account.name})
      );
    });

    return e(Modal, {type: this.props.type, header: this.props.header, form: accountReqs})
  }
}

class Message extends React.Component {
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

class Modal extends React.Component {
  render() {
    return (
      e('div', {className: 'modal', id: this.props.type + "Modal"},
        e('div', {className: 'modal-background'}, null),
        e('div', {className: 'modal-card'},
          e('header', {className: 'modal-card-head'},
            e('h2', {className: "modal-title"}, this.props.header)
          ),
          e('section', {className: 'modal-card-body'},
            e('div', {className: 'content'},
              e('form', {className: "addForm", id: this.props.type + "Form"}, this.props.form)
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

module.exports = {Goal: Goal, Timer: Timer, Requirement: Requirement, AccountModal: AccountModal, SwitchAccountModal: SwitchAccountModal, GoalModal: GoalModal, TimerModal: TimerModal, Message: Message};
