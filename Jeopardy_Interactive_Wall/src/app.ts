import * as MRE from '@microsoft/mixed-reality-extension-sdk';

enum GameState {
	Intro,
	WallOfQuestions,
	Question,
	Answer,
	Winner
}

/**
 * The structure of a hat entry in the hat database.
 */
// type QuestionDescriptor = {
// 	question: string;
// 	answers: {
// 		a: string;
// 		b: string;
// 		c: string;
// 		d: string;
// 	};
// };

type QuestionDescriptor = {
	question: string;
	answers: string[];
	isCorrect: boolean[];
};

/**
 * The structure of the hat database.
 */
type QuestionDatabase = {
	[key: string]: QuestionDescriptor;
};

type everyTeamBooleanList = {
	[key: string]: boolean[];
};

type everyTeamNumber = {
	[key: string]: number;
};

// Load the database of hats.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const QuestionDatabase: QuestionDatabase = require('../public/questions.json');

// function exampleCallbackFunction(actor: MRE.Actor, index: number, array: MRE.Actor[]) {
// 	if (actor.name === "Text00") {
// 		actor.text.contents === ""
// 		console.log(array[index])
// 	}
// }

/**
 * The main class of this app. All the logic goes here.
 */
export default class Quizshow {
	private assets: MRE.AssetContainer;
	private text: MRE.Actor = null;
	private cubes: MRE.Actor[] = [];
	private answers: MRE.Actor[] = [];
	private cubeAnchor: MRE.Actor = null;
	private answerAnchor: MRE.Actor = null;
	private orangeTeamPanel: MRE.Actor = null;
	private blueTeamPanel: MRE.Actor = null;
	private greenTeamPanel: MRE.Actor = null;
	private red: Partial<MRE.Color3Like> = new MRE.Color3( 255 / 255, 0 / 255, 0 / 255 );
	private orange: Partial<MRE.Color3Like> = new MRE.Color3( 255 / 255, 174 / 255, 25 / 255 );
	private blue: Partial<MRE.Color3Like> = new MRE.Color3( 51 / 255, 51 / 255, 255 / 255 );
	private lightblue: Partial<MRE.Color3Like> = new MRE.Color3( 0 / 255, 170 / 255, 255 / 255 );
	private green: Partial<MRE.Color3Like> = new MRE.Color3( 0 / 255, 255 / 255, 0 / 255 );
	private lightgreen: Partial<MRE.Color3Like> = new MRE.Color3( 51 / 255, 255 / 255, 51 / 255 );
	private black: Partial<MRE.Color3Like> = new MRE.Color3( 0 / 255, 0 / 255, 0 / 255 );
	private gameState: GameState;
	private cubeSizeX = 0.64;
	private cubeSizeY = 0.5;
	private cubeSizeZ = 0.2;
	private distBetweenCubesX = this.cubeSizeX / 2;
	private distCubeToCubeX = 2 * this.cubeSizeX + this.distBetweenCubesX;
	private distBetweenCubesY = this.cubeSizeY / 2;
	private distCubeToCubeY = 2 * this.cubeSizeY + this.distBetweenCubesY;
	private cubeCountY = 6; // Lines
	private cubeCountX = 5; // Columns
	private answerSizeX = 1.5;
	private answerSizeY = 0.5;
	private answerSizeZ = 0.2;
	private distBetweenAnswersX = this.answerSizeX / 2;
	private distAnswerToAnswerX = 2 * this.answerSizeX + this.distBetweenAnswersX;
	private distBetweenAnswersY = this.answerSizeY / 2;
	private distAnswerToAnswerY = 2 * this.answerSizeY + this.distBetweenAnswersY;
	private questionSizeX = 3.75;
	private questionSizeY = 1.5;
	private questionSizeZ = 0.2;
	private gltf: MRE.Asset[] = null;
	private cubeGrowAnimData: MRE.AnimationData = null;
	private answerGrowAnimData: MRE.AnimationData = null;
	private unreadyTeamsCount = 3;
	private isQuestionAnswered: boolean[] = [false,false,false,false,false,false,false,false,false,false,false,false,
		false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false];
	private categories = ["AltspaceVR", "SocialVR", "Medien\n(-didaktik)",
		"Soziales\nLernen", "Über das\nSeminar\nhinaus"];
	private clickedQuestion = "";
	private clickedPoints = 0;
	private lockedAnswers: everyTeamBooleanList = {
		"Green": [false,false,false,false],
		"Blue": [false,false,false,false],
		"Orange": [false,false,false,false]
	};
	private teamPoints: everyTeamNumber = {
		"Green": 0,
		"Blue": 0,
		"Orange": 0
	};
	private winnerKey: string[] = [];
	private winnerValue = -1;
	private clickedActor: MRE.Actor;
	
	constructor(public context: MRE.Context) {
		this.assets = new MRE.AssetContainer(context);
		this.context.onStarted(() => this.started());
	}

	/**
	 * Once the context is "started", initialize the app.
	 */
	private async started() {
		// Check whether code is running in a debuggable watched filesystem
		// environment and if so delay starting the app by 1 second to give
		// the debugger time to detect that the server has restarted and reconnect.
		// The delay value below is in milliseconds so 1000 is a one second delay.
		// You may need to increase the delay or be able to decrease it depending
		// on the speed of your PC.
		const delay = 1000;
		const argv = process.execArgv.join();
		const isDebug = argv.includes('inspect') || argv.includes('debug');

		// // version to use with non-async code
		// if (isDebug) {
		// 	setTimeout(this.startedImpl, delay);
		// } else {
		// 	this.startedImpl();
		// }

		// version to use with async code
		if (isDebug) {
			await new Promise(resolve => setTimeout(resolve, delay));
			await this.startedImpl();
		} else {
			await this.startedImpl();
		}
	}

	// use () => {} syntax here to get proper scope binding when called via setTimeout()
	// if async is required, next line becomes private startedImpl = async () => {
	private startedImpl = async () => {

		this.gltf = await this.assets.loadGltf('altspace-cube.glb', 'box');


		// // Here we create an animation for our text actor. First we create animation data, which can be used on any
		// // actor. We'll reference that actor with the placeholder "text".
		// const spinAnimData = this.assets.createAnimationData(
		// 	// The name is a unique identifier for this data. You can use it to find the data in the asset container,
		// 	// but it's merely descriptive in this sample.
		// 	"Spin",
		// 	{
		// 		// Animation data is defined by a list of animation "tracks": a particular property you want to change,
		// 		// and the values you want to change it to.
		// 		tracks: [{
		// 			// This animation targets the rotation of an actor named "text"
		// 			target: MRE.ActorPath("text").transform.local.rotation,
		// 			// And the rotation will be set to spin over 20 seconds
		// 			keyframes: this.generateSpinKeyframes(20, MRE.Vector3.Up()),
		// 			// And it will move smoothly from one frame to the next
		// 			easing: MRE.AnimationEaseCurves.Linear
		// 		}]
		// 	});


		// // Once the animation data is created, we can create a real animation from it.
		// spinAnimData.bind(
		// 	// We assign our text actor to the actor placeholder "text"
		// 	{ text: this.text },
		// 	// And set it to play immediately, and bounce back and forth from start to end
		// 	{ isPlaying: true, wrapMode: MRE.AnimationWrapMode.PingPong });

		// Create a new actor with no mesh, but some text.
		this.cubeAnchor = MRE.Actor.Create(this.context, {
			actor: {
				name: 'CubeAnchor',
				collider: { geometry: { shape: MRE.ColliderType.Auto } },
				transform: {
					app: {
						position: { x: 0, y: -1, z: 0 },
						rotation: MRE.Quaternion.FromEulerAngles( Math.PI/2, 0, 3*Math.PI/2 )
					}
				},
			}
		});

		// Create a new actor with no mesh, but some text.
		this.answerAnchor = MRE.Actor.Create(this.context, {
			actor: {
				name: 'AnswerAnchor',
				collider: { geometry: { shape: MRE.ColliderType.Auto } },
				transform: {
					app: {
						position: { x: -2.5, y: -1, z: 0 },
						rotation: MRE.Quaternion.FromEulerAngles( Math.PI/2, 0, 3/2*Math.PI )
					}
				},
			}
		});

		this.orangeTeamPanel = MRE.Actor.Create(this.context, {
			actor: {
				name: 'Orange',
				collider: { geometry: { shape: MRE.ColliderType.Auto } },
				transform: {
					app: {
						position: { x: 0, y: 34, z: 21 },
						rotation: MRE.Quaternion.FromEulerAngles( 10/6*Math.PI, 0, 3/2*Math.PI )
					}
				},
				text: {
					justify: MRE.TextJustify.Center,
					contents: "",
					color: this.orange,
				}
			}
		});

		this.blueTeamPanel = MRE.Actor.Create(this.context, {
			actor: {
				name: 'Blue',
				collider: { geometry: { shape: MRE.ColliderType.Auto } },
				transform: {
					app: {
						position: { x: 0, y: 40, z: 0 },
						rotation: MRE.Quaternion.FromEulerAngles( 3/2*Math.PI, 0, 3/2*Math.PI )
					}
				},
				text: {
					justify: MRE.TextJustify.Center,
					contents: "",
					color: this.blue,
				}
			}
		});

		this.greenTeamPanel = MRE.Actor.Create(this.context, {
			actor: {
				name: 'Green',
				collider: { geometry: { shape: MRE.ColliderType.Auto } },
				transform: {
					app: {
						position: { x: 0, y: 34, z: -21 },
						rotation: MRE.Quaternion.FromEulerAngles( 8/6*Math.PI, 0, 3/2*Math.PI ),
					}
				},
				text: {
					justify: MRE.TextJustify.Center,
					contents: "",
					color: this.lightgreen,
				}
			}
		});
			
		this.cubeGrowAnimData = this.assets.createAnimationData("Grow", { tracks: [{
			target: MRE.ActorPath("target").transform.local.scale,
			keyframes: this.CubeGrowKeyframeData
		}]});

		this.answerGrowAnimData = this.assets.createAnimationData("Grow", { tracks: [{
			target: MRE.ActorPath("target").transform.local.scale,
			keyframes: this.AnswerGrowKeyframeData
		}]});

		// const flipAnimData = this.assets.createAnimationData("DoAFlip", { tracks: [{
		// 	target: MRE.ActorPath("target").transform.local.rotation,
		// 	keyframes: this.generateSpinKeyframes(1.0, MRE.Vector3.Right())
		// }]});

		const pointMultiplicator = 50;

		for (let tileIndexY = 0; tileIndexY < this.cubeCountY; tileIndexY++) {
			for (let tileIndexX = 0; tileIndexX < this.cubeCountX; tileIndexX++) {
				// this.questionAnswered[tileIndexY].push(false);
				// Create a glTF actor
				const cube = MRE.Actor.CreateFromPrefab(this.context, {
					// Use the preloaded glTF for each box
					firstPrefabFrom: this.gltf,
					// Also apply the following generic actor properties.
					actor: {
						parentId: this.cubeAnchor.id,
						name: "Altspace Cube",
						collider: { geometry: { shape: MRE.ColliderType.Auto } },
						transform: {
							local: { 
								position: {
									x: this.distCubeToCubeX * (tileIndexX - ((this.cubeCountX-1) / 2 )),
									y: this.distCubeToCubeY * -(tileIndexY - ((this.cubeCountY-1) / 2 )),
									z: this.cubeSizeZ + 0.02,
								},
								scale: { x: this.cubeSizeX, y: this.cubeSizeY, z: this.cubeSizeZ} }
						},
						appearance: { enabled: true }
					}
				});


				// Create a list with all question cubes to allow iterating over all of them
				this.cubes.push(cube)

				// Create point numbers except in the first line
				if (tileIndexY !== 0) {
					this.text = MRE.Actor.Create(this.context, {
						actor: {
							parentId: cube.id,
							name: "Text".concat(tileIndexY.toString(),tileIndexX.toString()),
							collider: { geometry: { shape: MRE.ColliderType.Auto } },
							transform: {
								local: {
									position: {
										x: 0,
										y: 0,
										z: -1.1
									},
									scale: {
										x: this.cubeSizeY/this.cubeSizeX,
										y: 1,
										z: 1
									}
								}
							},
							text: {
								justify: MRE.TextJustify.Center,
								contents: (pointMultiplicator * tileIndexY).toString(),
								anchor: MRE.TextAnchorLocation.MiddleCenter,
								color: this.black,
								height: 1.1,
							},
							appearance: { enabled: true }
						}
					});
				} else {
					// Create category labels in the first line
					this.text = MRE.Actor.Create(this.context, {
						actor: {
							parentId: cube.id,
							name: "Text".concat(tileIndexY.toString(),tileIndexX.toString()),
							collider: { geometry: { shape: MRE.ColliderType.Auto } },
							transform: {
								local: {
									position: {
										x: 0,
										y: 0,
										z: -1.1
									},
									scale: {
										x: this.cubeSizeY/this.cubeSizeX,
										y: 1,
										z: 1
									}
								}
							},
							text: {
								justify: MRE.TextJustify.Center,
								contents: this.categories[tileIndexX],
								anchor: MRE.TextAnchorLocation.MiddleCenter,
								color: this.black,
								height: 0.4,
								pixelsPerLine: 1,
							},
							appearance: { enabled: true }
						}
					});
				}
			}
		}

		let line = 0;
		let column = 0;

		for (let y = 0; y < 2; y++) {
			for (let x = 0; x < 2; x++) {
				// Create a glTF actor
				const answer = MRE.Actor.CreateFromPrefab(this.context, {
					// Use the preloaded glTF for each box
					firstPrefabFrom: this.gltf,
					// Also apply the following generic actor properties.
					actor: {
						parentId: this.answerAnchor.id,
						name: "answer",
						collider: { geometry: { shape: MRE.ColliderType.Auto } },
						transform: {
							local: { 
								position: {
									x: this.distAnswerToAnswerX * (x - 1/2),
									y: this.distAnswerToAnswerY * -(y - 1/2) ,
									z: this.answerSizeZ,
								},
								scale: { x: this.answerSizeX, y: this.answerSizeY, z: this.answerSizeZ} }
						},
						appearance: { enabled: false }
					}
				});

				this.text = MRE.Actor.Create(this.context, {
					actor: {
						parentId: answer.id,
						name: "Answer".concat(x.toString(),y.toString()),
						collider: { geometry: { shape: MRE.ColliderType.Auto } },
						transform: {
							local: {
								position: {
									x: 0,
									y: 0,
									z: -1.1
								},
								scale: {
									x: this.answerSizeY/this.answerSizeX,
									y: 1,
									z: 1
								}
							}
						},
						text: {
							// NOTE: this is NOT the spinning text you see in your world
							// that Tic-Tac-Toe! text is in the beginGameStateIntro() function below
							justify: MRE.TextJustify.Center,
							contents: "",
							anchor: MRE.TextAnchorLocation.MiddleCenter,
							color: this.black,
							height: 0.5,
						},
						appearance: {enabled: false},
					}
				});

				// Create a list with all answers to allow iterating over all of them
				this.answers.push(answer)
			}
		}

		this.clickedActor = MRE.Actor.CreateFromPrefab(this.context, {
			// Use the preloaded glTF for each box
			firstPrefabFrom: this.gltf,
			// Also apply the following generic actor properties.
			actor: {
				parentId: this.cubeAnchor.id,
				name: "clickedActor",
				collider: { geometry: { shape: MRE.ColliderType.Auto } },
				transform: {
					local: { 
						position: {
							x: 0,
							y: 2,
							z: this.questionSizeZ,
						},
						scale: { x: this.questionSizeX, y: this.questionSizeY, z: this.questionSizeZ} }
				},
				appearance: { enabled: false }
			}
		});

		this.text = MRE.Actor.Create(this.context, {
			actor: {
				parentId: this.clickedActor.id,
				name: "currentQuestionText",
				collider: { geometry: { shape: MRE.ColliderType.Auto } },
				transform: {
					local: {
						position: {
							x: 0,
							y: 0,
							z: -1.1
						},
						scale: {
							x: this.questionSizeY/this.questionSizeX,
							y: 1,
							z: 1
						}
					}
				},
				text: {
					justify: MRE.TextJustify.Center,
					contents: "",
					anchor: MRE.TextAnchorLocation.MiddleCenter,
					color: this.black,
					height: 0.25,
				},
				appearance: {enabled: true},
			}
		});

		// Set up cursor interaction. We add the input behavior ButtonBehavior to the cube.
		// Button behaviors have two pairs of events: hover start/stop, and click start/stop.
		const currentQuestionBehavior = this.clickedActor.setBehavior(MRE.ButtonBehavior);

		// Loop for iterating over all answers!
		for (let j = 0; j < this.answers.length; j++) {
			this.answers[j].transform.local.position.z += 0.05;
			this.answers[j].appearance.enabled = false;
			this.answers[j].children[0].appearance.enabled = false;
		}
		// Loop for iterating over all cubes!
		for (let j = 0; j < this.cubes.length; j++) {
			this.cubes[j].transform.local.position.z -= 0.05;
			this.cubes[j].appearance.enabled = true;
			this.cubes[j].children[0].appearance.enabled = true;
		}

		// // Trigger the grow/shrink animations on hover.
		// // eslint-disable-next-line no-loop-func
		// currentQuestionBehavior.onHover('enter', () => {
		// 	if (this.gameState === GameState.Answer) {
		// 		this.clickedActor.targetingAnimationsByName.get("GrowIn").play();
		// 		this.clickedActor.targetingAnimationsByName.get("ShrinkOut").stop();
		// 	}
		// });

		// // eslint-disable-next-line no-loop-func
		// currentQuestionBehavior.onHover('exit', () => {
		// 	if (this.gameState === GameState.Answer) {
		// 		this.clickedActor.targetingAnimationsByName.get("GrowIn").stop();
		// 		this.clickedActor.targetingAnimationsByName.get("ShrinkOut").play();
		// 	}
		// });

		// eslint-disable-next-line no-loop-func
		currentQuestionBehavior.onClick(() => {
			switch (this.gameState) {
				case GameState.Intro:
					break;
				case GameState.WallOfQuestions:
					break;
				case GameState.Question:
					break;
				case GameState.Answer:
					// Loop for iterating over all cubes!
					for (let j = 0; j < this.cubes.length; j++) {
						// line = Math.floor((j - this.cubeCountX) / (this.cubeCountY - 1));
						// column = (j - this.cubeCountX) % (this.cubeCountY - 1);

						if (this.isQuestionAnswered[j] === false) {
							this.cubes[j].transform.local.position.z -= 0.05;
							this.cubes[j].appearance.enabled = true;
							this.cubes[j].children[0].appearance.enabled = true;
						}
					}

					// Loop for iterating over all answers!
					for (let j = 0; j < this.answers.length; j++) {
						this.answers[j].transform.local.position.z += 0.05;
						this.answers[j].appearance.enabled = false;
						this.answers[j].children[0].appearance.enabled = false;
						if (this.answers[j].children[0].text.color !== this.black) {
							this.answers[j].children[0].text.color = this.black
						}
						this.blueTeamPanel.children[j+1].appearance.enabled = false;
						this.greenTeamPanel.children[j+1].appearance.enabled = false;
						this.orangeTeamPanel.children[j+1].appearance.enabled = false;
					}

					this.gameState = GameState.WallOfQuestions;
					this.clickedActor.appearance.enabled = false;
					// for (let i = 0; i < this.answers.length; i++) {
					// 	this.answers[i].targetingAnimationsByName.get("GrowIn").stop();
					// 	this.answers[i].targetingAnimationsByName.get("ShrinkOut").play();
					// }
					this.blueTeamPanel.children[0].children[0].text.contents =
						"The Quizmaster chooses\nthe next question!";
					this.greenTeamPanel.children[0].children[0].text.contents = 
						"The Quizmaster chooses\nthe next question!";
					this.orangeTeamPanel.children[0].children[0].text.contents = 
						"The Quizmaster chooses\nthe next question!";
					break;
				case GameState.Winner:
					break;
			}
		});

		for (let i = this.cubeCountX; i < this.cubes.length; i++) {
			if (this.isQuestionAnswered[i] === true) {
				this.cubes[i].appearance.enabled = false;
				this.cubes[i].transform.local.position.z += 0.05;
			} else {
				// Create some animations on the cube.
				this.cubeGrowAnimData.bind({ target: this.cubes[i] }, { name: "GrowIn", speed: 1 });
				this.cubeGrowAnimData.bind({ target: this.cubes[i] }, { name: "ShrinkOut", speed: -1 });

				// Set up cursor interaction. We add the input behavior ButtonBehavior to the cube.
				// Button behaviors have two pairs of events: hover start/stop, and click start/stop.
				const cubeBehavior = this.cubes[i].setBehavior(MRE.ButtonBehavior);

				// Trigger the grow/shrink animations on hover.
				// eslint-disable-next-line no-loop-func
				cubeBehavior.onHover('enter', () => {
					if (this.gameState === GameState.WallOfQuestions) {
						this.cubes[i].targetingAnimationsByName.get("GrowIn").play();
						this.cubes[i].targetingAnimationsByName.get("ShrinkOut").stop();
					}
				});
				// eslint-disable-next-line no-loop-func
				cubeBehavior.onHover('exit', () => {
					if (this.gameState === GameState.WallOfQuestions) {
						this.cubes[i].targetingAnimationsByName.get("GrowIn").stop();
						this.cubes[i].targetingAnimationsByName.get("ShrinkOut").play();
					}
				});

				// eslint-disable-next-line no-loop-func
				cubeBehavior.onClick(() => {
					switch (this.gameState) {
						case GameState.Intro:
							break;
						case GameState.WallOfQuestions:
							line = Math.floor((i - this.cubeCountX) / (this.cubeCountY - 1));
							column = (i - this.cubeCountX) % (this.cubeCountY - 1);

							this.isQuestionAnswered[i] = true;
							this.cubes[i].transform.local.position.z += 50;
							// MRE.log.info("app", this.isQuestionAnswered.toString());

							this.clickedQuestion = "Frage" + column.toString() + line.toString();

							// eslint-disable-next-line no-case-declarations
							const currQ = QuestionDatabase[this.clickedQuestion];

							// Loop for iterating over all cubes!
							for (let j = 0; j < this.cubes.length; j++) {
								this.cubes[j].transform.local.position.z += 0.05;
								this.cubes[j].appearance.enabled = false;
								this.cubes[j].children[0].appearance.enabled = false;
							}

							// Loop for iterating over all answers!
							for (let j = 0; j < this.answers.length; j++) {
								this.answers[j].transform.local.position.z -= 0.05;
								this.answers[j].appearance.enabled = true;
								this.answers[j].children[0].appearance.enabled = true;
								this.answers[j].children[0].text.contents = currQ.answers[j];
								this.blueTeamPanel.children[j+1].children[0].text.contents = currQ.answers[j];
								this.greenTeamPanel.children[j+1].children[0].text.contents = currQ.answers[j];
								this.orangeTeamPanel.children[j+1].children[0].text.contents = currQ.answers[j];
								this.blueTeamPanel.children[j+1].appearance.enabled = true;
								this.greenTeamPanel.children[j+1].appearance.enabled = true;
								this.orangeTeamPanel.children[j+1].appearance.enabled = true;
								this.blueTeamPanel.children[j+1].children[0].text.color = this.black;
								this.greenTeamPanel.children[j+1].children[0].text.color = this.black;
								this.orangeTeamPanel.children[j+1].children[0].text.color = this.black;
							}
							this.blueTeamPanel.children[5].appearance.enabled = true;
							this.greenTeamPanel.children[5].appearance.enabled = true;
							this.orangeTeamPanel.children[5].appearance.enabled = true;
							this.blueTeamPanel.children[0].children[0].text.contents = 
								currQ.question;
							this.greenTeamPanel.children[0].children[0].text.contents = 
								currQ.question;
							this.orangeTeamPanel.children[0].children[0].text.contents = 
								currQ.question;
							this.blueTeamPanel.children[0].children[0].text.color = this.black;
							this.greenTeamPanel.children[0].children[0].text.color = this.black;
							this.orangeTeamPanel.children[0].children[0].text.color = this.black;
							this.blueTeamPanel.children[0].children[0].text.height = 0.25;
							this.greenTeamPanel.children[0].children[0].text.height = 0.25;
							this.orangeTeamPanel.children[0].children[0].text.height = 0.25;


							this.gameState = GameState.Question;
							this.clickedActor.children[0].text.contents = currQ.question;
							this.clickedActor.appearance.enabled = true;
							this.clickedPoints = Number(this.cubes[i].children[0].text.contents);

							this.lockedAnswers = {
								"Green": [false,false,false,false],
								"Blue": [false,false,false,false],
								"Orange": [false,false,false,false]
							};
							this.unreadyTeamsCount = 3;
							this.cubes[i].targetingAnimationsByName.get("GrowIn").stop();
							this.cubes[i].targetingAnimationsByName.get("ShrinkOut").play();
							break;
						case GameState.Question:
							break;
						case GameState.Answer:
							break;
						case GameState.Winner:
							break;
					}
				});
			}
		}

		// for (let i = 0; i < this.answers.length; i++) {
		// 	// Create some animations on the cube.
		// 	// this.answerGrowAnimData.bind({ target: this.answers[i] }, { name: "GrowIn", speed: 1 });
		// 	// this.answerGrowAnimData.bind({ target: this.answers[i] }, { name: "ShrinkOut", speed: -1 });
		// 	// flipAnimData.bind({ target: this.answers[i] });

		// 	// Set up cursor interaction. We add the input behavior ButtonBehavior to the cube.
		// 	// Button behaviors have two pairs of events: hover start/stop, and click start/stop.
		// 	// const answerBehavior = this.answers[i].setBehavior(MRE.ButtonBehavior);

		// 	// Trigger the grow/shrink animations on hover.
		// 	// eslint-disable-next-line no-loop-func
		// 	// answerBehavior.onHover('enter', () => {
		// 	// 	if (this.gameState === GameState.Question) {
		// 	// 		this.answers[i].targetingAnimationsByName.get("GrowIn").play();
		// 	// 		this.answers[i].targetingAnimationsByName.get("ShrinkOut").stop();
		// 	// 	}
		// 	// });

		// 	// eslint-disable-next-line no-loop-func
		// 	// answerBehavior.onHover('exit', () => {
		// 	// 	if (this.gameState === GameState.Question) {
		// 	// 		this.answers[i].targetingAnimationsByName.get("GrowIn").stop();
		// 	// 		this.answers[i].targetingAnimationsByName.get("ShrinkOut").play();
		// 	// 	}
		// 	// });

		// 	// eslint-disable-next-line no-loop-func
		// 	// answerBehavior.onClick(() => {
		// 	// 	switch (this.gameState) {
		// 	// 		case GameState.Intro:
		// 	// 			break;
		// 	// 		case GameState.WallOfQuestions:
		// 	// 			break;
		// 	// 		case GameState.Question:
		// 	// 			this.answers[i].targetingAnimationsByName.get("GrowIn").stop();
		// 	// 			this.answers[i].targetingAnimationsByName.get("ShrinkOut").play();
		// 	// 			break;
		// 	// 		case GameState.Answer:
		// 	// 			break;
		// 	// 		case GameState.Winner:
		// 	// 			break;
		// 	// 	}
		// 	// });
		// }

		// ----- TEAM ORANGE (left from Stage, looking as audience) ----- //
		
		// let orangePanel = this.addTeamPanelButtons("orange")
		this.addTeamPanelButtons(this.orangeTeamPanel)

		// ----- TEAM BLUE ----- (in the middle, looking as audience) //

		// let bluePanel = this.addTeamPanelButtons("blue")
		this.addTeamPanelButtons(this.blueTeamPanel)

		// ----- TEAM GREEN ----- (right from Stage, looking as audience) //

		// let greenPanel = this.addTeamPanelButtons("green")
		this.addTeamPanelButtons(this.greenTeamPanel)

		// Now that the text and its animation are all being set up, we can start playing
		// the animation.
		this.beginGameStateWallOfQuestions();
	}

	private addTeamPanelButtons(panel: MRE.Actor) {
		const teamPanelQuestion = MRE.Actor.CreateFromPrefab(this.context, {
			// Use the preloaded glTF for each box
			firstPrefabFrom: this.gltf,
			// Also apply the following generic actor properties.
			actor: {
				parentId: panel.id,
				name: "currentTeamQuestion",
				collider: { geometry: { shape: MRE.ColliderType.Auto } },
				transform: {
					local: { 
						position: {
							x: 0,
							y: 2,
							z: this.questionSizeZ,
						},
						scale: { x: this.questionSizeX, y: this.questionSizeY, z: this.questionSizeZ} }
				},
				appearance: { enabled: true }
			}
		});

		// Add Question Text to Panel
		this.text = MRE.Actor.Create(this.context, {
			actor: {
				parentId: teamPanelQuestion.id,
				name: "currentQuestionText",
				collider: { geometry: { shape: MRE.ColliderType.Auto } },
				transform: {
					local: {
						position: {
							x: 0,
							y: 0,
							z: -1.1
						},
						scale: {
							x: this.questionSizeY/this.questionSizeX,
							y: 1,
							z: 1
						}
					},
				},
				text: {
					justify: MRE.TextJustify.Center,
					contents: panel.name + " Team!",
					anchor: MRE.TextAnchorLocation.MiddleCenter,
					color: panel.text.color,
					height: 0.6
				},
				appearance: {enabled: true},
			}
		});
		
		for (let y = 0; y < 2; y++) {
			for (let x = 0; x < 2; x++) {
				// Create a glTF actor
				const teamAnswer = MRE.Actor.CreateFromPrefab(this.context, {
					// Use the preloaded glTF for each box
					firstPrefabFrom: this.gltf,
					// Also apply the following generic actor properties.
					actor: {
						parentId: panel.id,
						name: "teamAnswer",
						collider: { geometry: { shape: MRE.ColliderType.Auto } },
						transform: {
							local: {
								position: {
									x: this.distAnswerToAnswerX * (x - 1/2),
									y: this.distAnswerToAnswerY * -(y - 1/2) - 3,
									z: this.answerSizeZ,
								},
								scale: { x: this.answerSizeX, y: this.answerSizeY, z: this.answerSizeZ} }
						},
						appearance: { enabled: false }
					}
				});

				this.text = MRE.Actor.Create(this.context, {
					actor: {
						parentId: teamAnswer.id,
						name: "Answer".concat(x.toString(),y.toString()),
						collider: { geometry: { shape: MRE.ColliderType.Auto } },
						transform: {
							local: {
								position: {
									x: 0,
									y: 0,
									z: -1.1
								},
								scale: {
									x: this.answerSizeY/this.answerSizeX,
									y: 1,
									z: 1
								}
							}
						},
						text: {
							// NOTE: this is NOT the spinning text you see in your world
							// that Tic-Tac-Toe! text is in the beginGameStateIntro() function below
							justify: MRE.TextJustify.Center,
							contents: "",
							anchor: MRE.TextAnchorLocation.MiddleCenter,
							color: this.black,
							height: 0.5,
						},
						appearance: {enabled: true},
					}
				});
			}
		}

		const lockTeamAnswers = MRE.Actor.CreateFromPrefab(this.context, {
			// Use the preloaded glTF for each box
			firstPrefabFrom: this.gltf,
			// Also apply the following generic actor properties.
			actor: {
				parentId: panel.id,
				name: "lockTeamAnswers",
				collider: { geometry: { shape: MRE.ColliderType.Auto } },
				transform: {
					local: {
						position: {
							x: 0,
							y: -0.5,
							z: this.answerSizeZ,
						},
						scale: { x: this.answerSizeX, y: this.answerSizeY, z: this.answerSizeZ} }
				},
				appearance: { enabled: false }
			}
		});

		this.text = MRE.Actor.Create(this.context, {
			actor: {
				parentId: lockTeamAnswers.id,
				name: "lockTeamAnswers",
				collider: { geometry: { shape: MRE.ColliderType.Auto } },
				transform: {
					local: {
						position: {
							x: 0,
							y: 0,
							z: -1.1
						},
						scale: {
							x: this.answerSizeY/this.answerSizeX,
							y: 1,
							z: 1
						}
					}
				},
				text: {
					// NOTE: this is NOT the spinning text you see in your world
					// that Tic-Tac-Toe! text is in the beginGameStateIntro() function below
					justify: MRE.TextJustify.Center,
					contents: "Lock Answers",
					anchor: MRE.TextAnchorLocation.MiddleCenter,
					color: this.black,
					height: 0.7,
				},
				appearance: {enabled: true},
			}
		});

		// Points Label
		this.text = MRE.Actor.Create(this.context, {
			actor: {
				parentId: panel.id,
				name: panel.name + "Points",
				collider: { geometry: { shape: MRE.ColliderType.Auto } },
				transform: {
					local: {
						position: {
							x: 0,
							y: 6,
							z: -1.1 + this.questionSizeZ
						},
						scale: {
							x: this.questionSizeY,
							y: this.questionSizeY,
							z: this.questionSizeZ
						}
					}
				},
				text: {
					// NOTE: this is NOT the spinning text you see in your world
					// that Tic-Tac-Toe! text is in the beginGameStateIntro() function below
					justify: MRE.TextJustify.Center,
					contents: panel.name + " Points:\n" + this.teamPoints[panel.name],
					anchor: MRE.TextAnchorLocation.MiddleCenter,
					color: panel.text.color,
					height: 0.6,
				},
				appearance: {enabled: true},
			}
		});

		for (let i = 1; i < 6; i++) {
			// Create some animations on the cube.
			this.answerGrowAnimData.bind({ target: panel.children[i] }, { name: "GrowIn", speed: 1 });
			this.answerGrowAnimData.bind({ target: panel.children[i] }, { name: "ShrinkOut", speed: -1 });
			// flipAnimData.bind({ target: panel.children[i] });

			// Set up cursor interaction. We add the input behavior ButtonBehavior to the cube.
			// Button behaviors have two pairs of events: hover start/stop, and click start/stop.
			const answerBehavior = panel.children[i].setBehavior(MRE.ButtonBehavior);

			// Trigger the grow/shrink animations on hover.
			// eslint-disable-next-line no-loop-func
			answerBehavior.onHover('enter', () => {
				if (this.gameState === GameState.Question || this.gameState === GameState.Answer) {
					panel.children[i].targetingAnimationsByName.get("GrowIn").play();
					panel.children[i].targetingAnimationsByName.get("ShrinkOut").stop();
				}
			});

			// eslint-disable-next-line no-loop-func
			answerBehavior.onHover('exit', () => {
				if (this.gameState === GameState.Question || this.gameState === GameState.Answer) {
					panel.children[i].targetingAnimationsByName.get("GrowIn").stop();
					panel.children[i].targetingAnimationsByName.get("ShrinkOut").play();
				}
			});

			// AnswerButtons
			// eslint-disable-next-line no-loop-func
			if (i !== 5) {
				answerBehavior.onClick(() => {
					switch (this.gameState) {
						case GameState.Intro:
							break;
						case GameState.WallOfQuestions:
							break;
						case GameState.Question:
							// Mark selected answer lightblue
							if (this.lockedAnswers[panel.name][i-1] === false) {
								this.lockedAnswers[panel.name][i-1] = true;
								panel.children[i].children[0].text.color = this.lightblue;
							} else {
								this.lockedAnswers[panel.name][i-1] = false;
								panel.children[i].children[0].text.color = this.black;
							}
							break;
						case GameState.Answer:
							break;
						case GameState.Winner:
							break;
					}
				});
			} else {
			// LockAnswersButton
				answerBehavior.onClick(() => {
					switch (this.gameState) {
						case GameState.Intro:
							break;
						case GameState.WallOfQuestions:
							break;
						case GameState.Question:
							panel.children[5].appearance.enabled = false;
							panel.children[0].children[0].text.contents = "Answers Locked!\nWaiting for other Teams"
							if (this.unreadyTeamsCount === 1) {
								for (let j = 0; j < this.answers.length; j++) {
									if (QuestionDatabase[this.clickedQuestion].isCorrect[j]) {
										this.answers[j].children[0].text.color = this.green;
									} else {
										this.answers[j].children[0].text.color = this.red;
									}
								}
								const currQ = QuestionDatabase[this.clickedQuestion];
								// MRE.log.info("app", this.isQuestionAnswered.slice(5).every(Boolean));

								if (this.isQuestionAnswered.slice(5).every(Boolean)) {
									if (this.boolListsEqual(this.lockedAnswers["Green"],currQ.isCorrect)) {
										this.teamPoints["Green"] += this.clickedPoints
										this.greenTeamPanel.children[6].text.contents =
											"Green" + " Points:\n" + this.teamPoints["Green"];
									}
									if (this.boolListsEqual(this.lockedAnswers["Blue"],currQ.isCorrect)) {
										this.teamPoints["Blue"] += this.clickedPoints
										this.blueTeamPanel.children[6].text.contents =
											"Blue" + " Points:\n" + this.teamPoints["Blue"];
									}
									if (this.boolListsEqual(this.lockedAnswers["Orange"],currQ.isCorrect)) {
										this.teamPoints["Orange"] += this.clickedPoints
										this.orangeTeamPanel.children[6].text.contents =
											"Orange" + " Points:\n" + this.teamPoints["Orange"];
									}
									this.gameState = GameState.Winner;
									for (const key in this.teamPoints) {
										const value = this.teamPoints[key]
										if (this.winnerKey.length === 0) {
											this.winnerKey.push(key)
											this.winnerValue = -1
										}
										if (value > this.winnerValue) {
											this.winnerKey = [key]
											this.winnerValue = value;
										} else if (value === this.winnerValue && !this.winnerKey.includes(key)) {
											this.winnerKey.push(key)
										}
									}
									this.greenTeamPanel.children[0].children[0].text.contents =
										"See winner\non Main Panel!";
									this.blueTeamPanel.children[0].children[0].text.contents =
										"See winner\non Main Panel!";
									this.orangeTeamPanel.children[0].children[0].text.contents =
										"See winner\non Main Panel!";
									for (let j = 0; j < this.answers.length; j++) {
										this.answers[j].appearance.enabled = false
										this.blueTeamPanel.children[j+1].appearance.enabled = false;
										this.greenTeamPanel.children[j+1].appearance.enabled = false;
										this.orangeTeamPanel.children[j+1].appearance.enabled = false;
									}
									if (this.winnerKey.length === 1) {
										this.clickedActor.children[0].text.contents = "Team " + this.winnerKey[0] +
											" won\nwith " + this.winnerValue + " Points!\n \nCongratulations!"
									} else {
										this.clickedActor.children[0].text.contents = "Team " + this.winnerKey[0]
										for (let j = 1; j < this.winnerKey.length; j++) {
											this.clickedActor.children[0].text.contents +=
												" and " + this.winnerKey[j]
										}
										this.clickedActor.children[0].text.contents +=
											" won\nwith " + this.winnerValue + " Points!\n \nCongratulations!"
									}
								} else {
									if (this.boolListsEqual(this.lockedAnswers["Green"],currQ.isCorrect)) {
										this.teamPoints["Green"] += this.clickedPoints
										this.greenTeamPanel.children[6].text.contents =
											"Green" + " Points:\n" + this.teamPoints["Green"];
									}
									if (this.boolListsEqual(this.lockedAnswers["Blue"],currQ.isCorrect)) {
										this.teamPoints["Blue"] += this.clickedPoints
										this.blueTeamPanel.children[6].text.contents =
											"Blue" + " Points:\n" + this.teamPoints["Blue"];
									}
									if (this.boolListsEqual(this.lockedAnswers["Orange"],currQ.isCorrect)) {
										this.teamPoints["Orange"] += this.clickedPoints
										this.orangeTeamPanel.children[6].text.contents =
											"Orange" + " Points:\n" + this.teamPoints["Orange"];
									}
									this.gameState = GameState.Answer;
									this.greenTeamPanel.children[0].children[0].text.contents =
										"See solution\non Main Panel!";
									this.blueTeamPanel.children[0].children[0].text.contents =
										"See solution\non Main Panel!";
									this.orangeTeamPanel.children[0].children[0].text.contents =
										"See solution\non Main Panel!";
								}
								panel.children[i].targetingAnimationsByName.get("GrowIn").stop();
								panel.children[i].targetingAnimationsByName.get("ShrinkOut").play();
							} else {
								this.unreadyTeamsCount = this.unreadyTeamsCount - 1;
							}
							break;
						case GameState.Answer:
							break;
						case GameState.Winner:
							break;
					}
				});
			}
		}
	}

	private beginGameStateWallOfQuestions() {
		MRE.log.info("app", "BeginGameState WallOfQuestions");
		this.gameState = GameState.WallOfQuestions;
		// this.text.text.contents = "Question 1:\nFunktioniert dieses Spiel gut?";

	}

	// private beginGameStatePlay() {
	// 	MRE.log.info("app", "BeginGameState Play");
	// 	this.gameState = GameState.Play;
	// 	this.text.text.contents = "First Piece: " + GamePiece[this.currentPlayerGamePiece];
	// }

	/**
	 * Generate keyframe data for a simple spin animation.
	 * @param duration The length of time in seconds it takes to complete a full revolution.
	 * @param axis The axis of rotation in local space.
	 */

	// private generateSpinKeyframes(duration: number, axis: MRE.Vector3): Array<MRE.Keyframe<MRE.Quaternion>> {
	// 	return [{
	// 		time: 0 * duration,
	// 		value: MRE.Quaternion.RotationAxis(axis, 0)
	// 	}, {
	// 		time: 0.25 * duration,
	// 		value: MRE.Quaternion.RotationAxis(axis, Math.PI / 2)
	// 	}, {
	// 		time: 0.5 * duration,
	// 		value: MRE.Quaternion.RotationAxis(axis, Math.PI)
	// 	}, {
	// 		time: 0.75 * duration,
	// 		value: MRE.Quaternion.RotationAxis(axis, 3 * Math.PI / 2)
	// 	}, {
	// 		time: 1 * duration,
	// 		value: MRE.Quaternion.RotationAxis(axis, 2 * Math.PI)
	// 	}];
	// }

	private boolListsEqual (list1: boolean[],list2: boolean[]) {
		const check: boolean[] = [];
		if (list1.length === list2.length) {
			for (let i = 0; i < list1.length; i++) {
				check.push(false)
			}
			for (let i = 0; i < list1.length; i++) {
				if (list1[i] === list2[i]) {
					check[i] = true
				}
			}
			if (check.every(Boolean)) {
				return true
			} else {
				return false
			}
		} else {
			MRE.log.info("app", "ERROR: " + list1.toString() + " and " + list1.toString() + "are not of equal length");
		}
	}

	private CubeGrowKeyframeData: Array<MRE.Keyframe<MRE.Vector3>> = [{
		time: 0,
		value: { x: this.cubeSizeX, y: this.cubeSizeY, z: this.cubeSizeZ}
	}, {
		time: 0.3,
		value: { x: 1.2 * this.cubeSizeX, y: 1.2 * this.cubeSizeY, z: this.cubeSizeZ }
	}];
	
	private AnswerGrowKeyframeData: Array<MRE.Keyframe<MRE.Vector3>> = [{
		time: 0,
		value: { x: this.answerSizeX, y: this.answerSizeY, z: this.answerSizeZ}
	}, {
		time: 0.3,
		value: { x: 1.2 * this.answerSizeX, y: 1.2 * this.answerSizeY, z: this.answerSizeZ }
	}];
}
