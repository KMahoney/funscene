# funscene

Funscene is a way to declare a 2d WebGL animation. The animations are
described using matrix transforms and are defined in terms of the
elapsed time. It's quite simple and low level.

This might be useful for turn based games and WebGL user
interfaces. It's less useful for action-style games.

Advantages:

* Very little per-frame garbage, which means the gargbage collector
  won't jump in and cause jitter.

* When the animations have finished, rendering stops. Efficient and
  saves battery.

A demo is running at http://kevinmahoney.co.uk/funscene/example/ (source in the `example` folder)

## Hello World Example

```javascript

import { Texture, Sprite, Context, Scene } from 'funscene'
import { interpolators, noOp, sequence, combine, fade, move, repeat } from 'funscene/transformers'

var canvas = <HTMLCanvasElement> document.getElementById("stage");
var context = new Context(canvas);
context.fullscreen();

var hello_world = context.createTexture(250, 50);
hello_world.make(function (context) {
    context.fillStyle = "rgb(200,200,200)";
    context.font = "40px sans";
    context.fillText("Hello World!",0,50);
});

var sprites = [
    new Sprite(
        hello_world,
        sequence([
            // fade in and scroll from top of the screen
            combine([
                fade(interpolators.linear, 3000, 0, 1),
                move(interpolators.inverseCubic, 3000, 0,0, 0,300)
            ]),
            // move left and right, repeat
            repeat([
                move(interpolators.inverseCubic, 3000, 0,300, 300,300),
                move(interpolators.inverseCubic, 3000, 300,300, 0,300)
            ])
        ]))
];

var scene = new Scene(noOp, sprites);
context.runAnimation(scene.createAnimation());

```

http://kevinmahoney.co.uk/funscene/hello-world/
