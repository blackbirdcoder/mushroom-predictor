import kaplay from 'kaplay';
import { zzfx } from '/public/libs/zzfx.micro.js';

const settings = {
    sprites: [
        'backgroundImage',
        'backgroundText',
        'buttonClose',
        'mushroomXS',
        'mushroomS',
        'mushroomM',
        'mushroomL',
        'star',
    ],
    font: 'silkscreen',
    scene: {
        width: 360,
        height: 640,
    },
    colors: {
        background: '#261152',
    },
    positions: {
        xs: { x: 10, y: 63 },
        s: { x: 10, y: 63 },
        m: { x: 10, y: 50 },
        l: { x: 10, y: 50 },
        xl: { x: 10, y: 20 },
    },
    scales: {
        default: 1,
        xl: 1.5,
    },
    clickLimit: 10, // 100
};

function Resource(k, spritesNames, fontName) {
    this.loader = function () {
        spritesNames.forEach((item) => {
            k.loadSprite(item, `./sprites/${item}.png`);
        });

        k.loadFont(fontName, `./fonts/${fontName}.woff2`);
    };
}

function Scene(k, settings) {
    this.paintOver = function () {
        k.onDraw(() => {
            k.drawRect({
                width: settings.scene.width,
                height: settings.scene.height,
                pos: k.vec2(0, 0),
                get pos() {
                    return this._pos;
                },
                set pos(value) {
                    this._pos = value;
                },
                color: k.rgb(settings.colors.background),
            });
        });
    };

    this.clickableArea = function () {
        return k.add([
            k.sprite('backgroundImage'),
            k.pos(k.center()),
            k.anchor('center'),
            k.scale(1),
            k.layer('scene'),
            k.area({ shape: new k.Rect(k.vec2(0, 0), 275, 275) }),
        ]);
    };

    this.addChild = function (parent, childSize, posX, posY, childSpriteName) {
        if (parent.children.length > 0) parent.children.splice(0);
        const child = k.make([
            k.sprite(childSpriteName),
            k.pos(posX, posY),
            k.scale(childSize),
            k.anchor('center'),
            k.layer('scene'),
        ]);
        parent.add(child);
    };
}

function ClickHandler(k, activeZone, dataStorage) {
    this.listen = function (cbProvideNotice) {
        let tapId = undefined;
        activeZone.onClick(() => {
            if (dataStorage.countClick < dataStorage.limit && !k.isTouchscreen()) ++dataStorage.countClick;

            if (dataStorage.countClick < dataStorage.limit && k.isTouchscreen() && tapId === 0) {
                tapId = undefined;
                ++dataStorage.countClick;
            }
        });

        activeZone.onTouchStart((_, tap) => {
            if (tap.identifier === 0) tapId = tap.identifier;
        });

        activeZone.onUpdate(() => {
            if (dataStorage.countClick === dataStorage.limit) {
                k.debug.log(cbProvideNotice());
            }
        });
    };
}

function Manager(k, settings) {
    this.dataStorageInit = function () {
        return {
            countClick: 0,
            limit: settings.clickLimit,
        };
    };

    this.provideNotice = function () {
        return 'YOU WIN';
    };
}

function UserInterface(k, settings) {
    this.topPanel = function () {
        const options = {
            width: 336,
            height: 64,
            x: 12,
            y: 12,
        };
        const border = k.add([
            k.rect(options.width, options.height, { fill: false }),
            k.outline(10, k.WHITE),
            k.pos(options.x, options.y),
        ]);
        const panel = k.add([
            k.sprite('backgroundText', { tiled: true, width: options.width, height: options.height }),
            k.pos(options.x, options.y),
        ]);
    };
}

(function main(settings) {
    const k = kaplay({
        width: settings.scene.width,
        height: settings.scene.height,
        stretch: true,
        letterbox: true,
        pixelDensity: 2,
        debugKey: 'd', // DELETE
    });
    k.debug.inspect = true; // DELETE

    k.layers(['scene', 'ui'], 'scene');
    const resource = new Resource(k, settings.sprites, settings.font);
    resource.loader();
    const scene = new Scene(k, settings);
    scene.paintOver();
    const area = scene.clickableArea();
    scene.addChild(area, settings.scales.default, settings.positions.xs.x, settings.positions.xs.y, 'mushroomXS');
    const userInterface = new UserInterface(k, settings);
    const manager = new Manager(k, settings);
    const dataStorage = manager.dataStorageInit();
    const clickHandler = new ClickHandler(k, area, dataStorage);
    clickHandler.listen(manager.provideNotice);
    userInterface.topPanel();
    // TODO: Continue. UI add score text

    //k.add([k.pos(120, 80), k.sprite('backgroundImage'), k.scale(1)]);

    /*
    area.onClick(() => {
        zzfx('1.8,0,543,.01,.06,.16,0,2.6,0,30,0,0,0,0,0,0,0,.73,.04,0,550');
       
    });
    */
})(settings);
