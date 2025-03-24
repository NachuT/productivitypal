# NOTE: 
Tester23 is the folder for the electron app

## Inspiration
Being productive is a daily problem that is made harder by social media and distractions. In fact, according to the Atlantic Health System, almost half of all teenagers spend at least 4 hours a day on social media. This makes it hard to finish schoolwork and complete assigned work and tasks throughout the day. Our solution to this is an app that harnesses the same competitive peer-driven system as social media. Through the utilization of a leaderboard system, users are encouraged to keep up with their peers and spend more time being productive. As a matter of fact, according to the National Institute of Health, 48% of students liked and were motivated by a leaderboard system, in a study comparing the effects of gamified online physics classes.

## What it does
Productivity Pal tracks the time spent on productive sites and applications, then productivity pal increases your leaderboard score when you spend more time. Later, Productivity Pal displays this leaderboard, comparing the user's score to the score of the user's peers. If the user is productive, the score increases by 40 points for each second.

## How we built it
Productivity Pal works by taking screen captures every 40 seconds. These screen captures are sent to the Python library, OCR, to extract the text from the image. This text is then sent to a Llama API to scan for keywords and determine whether a task is productive or not. If the task is productive, then the user's score on the leaderboard increases. The user's score increases by 40 points for each second, to be specific. This is due to a rate limit, as the project is being hosted locally, limiting the frequency of checks of the project.

## Challenges we ran into
In the beginning, we attempted to use a FNN (Feedforward Neural Network) to identify letters and numbers in images; however, we didn’t achieve the desired accuracy as we encountered overfitting issues. We spent multiple hours training the model and fixing the code, eventually achieving a 86.8% accuracy; However, we realized that OCR performs the same function, but does it faster and more efficiently.

Later we had issues in connecting both the Electron Js and python using flask. The frontend was also experiencing issues with taking screen captures of the users screen. 

## Accomplishments that we're proud of
Experimenting with different types of model architectures such as FNN models, we are proud of creating an application that encourages users to spend their valuable time more productively. 

## What we learned
Electron JS, along with integrating the Llama API and OCR text extraction, developing and integrating an FNN model along with connecting the frontend and backend with flask. 

##Video
In the video we create an account and then login. From our new login we can view the leaderboard and start our session. We notice that when we went on Instagram we didn't get any points however when we went onto a homework assignment it gave us 40 points.

## What's next for Productivity Pal
Creating a quiz to check how much the student understands and boosting leaderboard scores based on high quiz scores. Later we also plan to have remainders that push the user to be productive if they are unproductive.

