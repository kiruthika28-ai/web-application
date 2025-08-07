// === script.js ===

// Check if user is logged in
document.addEventListener('DOMContentLoaded', () => {
  const user = localStorage.getItem('user');
  if (user) {
    showDashboard();
  } else {
    showLoginForm();
  }
});

// === Authentication ===
function showLoginForm() {
  document.getElementById('app').innerHTML = `
    <h2>Login</h2>
    <input type="email" id="email" placeholder="Email" />
    <input type="password" id="password" placeholder="Password" />
    <button onclick="login()">Login</button>
  `;
}

function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  fetch('/api/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ email, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.token) {
        localStorage.setItem('user', JSON.stringify(data));
        showDashboard();
      } else {
        alert('Login failed');
      }
    });
}

// === Dashboard ===
function showDashboard() {
  document.getElementById('app').innerHTML = `
    <h2>Welcome to SkillSprint</h2>
    <button onclick="loadLessons()">Start Learning</button>
    <button onclick="logout()">Logout</button>
    <div id="lesson-container"></div>
  `;
}

function logout() {
  localStorage.removeItem('user');
  showLoginForm();
}

// === Lessons ===
function loadLessons() {
  fetch('/api/lessons')
    .then(res => res.json())
    .then(lessons => {
      const container = document.getElementById('lesson-container');
      container.innerHTML = '<h3>Available Lessons:</h3>';
      lessons.forEach(lesson => {
        const lessonEl = document.createElement('div');
        lessonEl.innerHTML = `
          <h4>${lesson.title}</h4>
          <p>${lesson.description}</p>
          <button onclick="startLesson('${lesson.id}')">Start Lesson</button>
        `;
        container.appendChild(lessonEl);
      });
    });
}

// === Lesson View ===
function startLesson(lessonId) {
  fetch(`/api/lessons/${lessonId}`)
    .then(res => res.json())
    .then(lesson => {
      document.getElementById('lesson-container').innerHTML = `
        <h3>${lesson.title}</h3>
        <p>${lesson.content}</p>
        <button onclick="loadQuiz('${lesson.id}')">Take Quiz</button>
      `;
    });
}

// === Quiz ===
function loadQuiz(lessonId) {
  fetch(`/api/quizzes/${lessonId}`)
    .then(res => res.json())
    .then(quiz => {
      let html = `<h3>Quiz: ${quiz.title}</h3><form id="quiz-form">`;
      quiz.questions.forEach((q, idx) => {
        html += `<p>${q.question}</p>`;
        q.options.forEach(opt => {
          html += `
            <label>
              <input type="radio" name="q${idx}" value="${opt}" />
              ${opt}
            </label><br/>
          `;
        });
      });
      html += `<button type="submit">Submit Quiz</button></form>`;
      document.getElementById('lesson-container').innerHTML = html;

      document.getElementById('quiz-form').addEventListener('submit', function (e) {
        e.preventDefault();
        const answers = Array.from(new FormData(this).entries());
        submitQuiz(lessonId, answers);
      });
    });
}

function submitQuiz(lessonId, answers) {
  fetch(`/api/quizzes/${lessonId}/submit`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ answers })
  })
    .then(res => res.json())
    .then(result => {
      if (result.passed) {
        document.getElementById('lesson-container').innerHTML = `
          <h3>✅ Congratulations! You passed!</h3>
          <p>Your score: ${result.score}%</p>
          <a href="${result.certificateUrl}" target="_blank">Download Certificate</a>
        `;
      } else {
        document.getElementById('lesson-container').innerHTML = `
          <h3>❌ You did not pass. Try again.</h3>
          <p>Your score: ${result.score}%</p>
          <button onclick="loadQuiz('${lessonId}')">Retry Quiz</button>
        `;
      }
    });
}
