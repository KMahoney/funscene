import { Texture, Sprite, Context, Scene } from '../src/funscene'
import { interpolators, blend, wait, combine, fade, move, translate, rotate, repeat, sequence } from '../src/funscene/transformers'

const canvas = <HTMLCanvasElement> document.getElementById("stage");
const context = new Context(canvas);
context.fullscreen();

// Make a blue square texture by drawing to a canvas context
const blue_square = context.createTexture(200, 200);
blue_square.make(function (context) {
    context.fillStyle = "rgb(80,80,200)";
    context.fillRect(0,0, 200,200);
});

// Make a happy face texture by drawing to a canvas context
const happy = context.createTexture(100, 100);
happy.make(function (context) {
    context.strokeStyle = "rgb(200,200,100)";
    context.lineWidth = 5;
    context.beginPath();
    context.arc(50, 50, 40, 0, 2*Math.PI);
    context.stroke();
    context.beginPath();
    context.arc(30, 34, 3, 0, 2*Math.PI);
    context.stroke();
    context.beginPath();
    context.arc(70, 34, 3, 0, 2*Math.PI);
    context.stroke();
    context.beginPath();
    context.arc(50, 50, 20, 0, Math.PI, false);
    context.stroke();
});


function buildScene(context: Context) {
    // Use the inverse cubic interpolator for all the animations. This
    // looks a bit like natural acceleration/friction.
    const interp = interpolators.inverseCubic;

    // A blue square roams the perimeter
    var sprites = [
        new Sprite(
            blue_square,

            // move around the edge and repeat
            repeat([
                move(interp, 1000, 0,0, 800,0),
                move(interp, 1000, 800,0, 800,800),
                move(interp, 1000, 800,800, 0,800),
                move(interp, 1000, 0,800, 0,0),
            ])),
    ];

    // A grid of happy faces!
    for (var i = 0; i < 100; i++) {
        sprites.push(new Sprite(
            happy,
            combine([
                // order them in to a grid
                translate(100 * Math.floor(i / 10), Math.floor(i % 10) * 100),

                sequence([
                    // they take turns to...
                    wait(i * 1000),

                    combine([
                        // gradually turn red
                        blend(interp, 6000, [1,1,1,1], [1,0,0,1]),

                        // rotate around their middle
                        translate(50, 50),
                        repeat([
                            rotate(interp, 1000, 0, 1)
                        ]),
                        translate(-50, -50),
                    ])
                ])
            ])
        ));
    }

    // Fade a blue square in and out
    sprites.push(new Sprite(blue_square, combine([
        // Put it in the middle
        translate(1000/2-100, 1000/2-100),

        // fade in and out
        repeat([
            fade(interp, 1000, 0, 1),
            fade(interp, 1000, 1, 0),
        ])
    ])));


    // The camera
    var world = combine([
        // focus on the middle
        translate(context.width/2-500, context.height/2-500),

        repeat([
            // wait 6 seconds
            wait(6000),

            // spin around the centre!
            combine([
                translate(500, 500),
                rotate(interp, 3000, 0,1),
                translate(-500, -500),
            ])
        ])
    ]);

    return new Scene(world, sprites);
}

// Run the scene
context.runAnimation(buildScene(context).createAnimation());

// If the context is resized we need to recreate the scene as the
// camera won't be pointing at the middle any more
window.addEventListener("contextResize", function () {
    context.runAnimation(buildScene(context).createAnimation());
});
