import kaplay from 'kaplay';
import { zzfx } from '/src/libs/zzfx.micro.js';
import { text } from '/src/data/data.json' assert { type: 'JSON' };

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
    clickLimit: 100,
    vibrationPattern: [100, 50, 100],
    predictions: text,
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
            k.area({
                shape: new k.Polygon(this._createPolygon()),
            }),
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

    this._createPolygon = function () {
        const r = 150;
        const parts = 48;
        const points = [];

        for (let i = 0; i < parts; i++) {
            const x = Math.cos((2 * Math.PI * i) / parts) * r;
            const y = Math.sin((2 * Math.PI * i) / parts) * r;
            points.push(k.vec2(x, y));
        }

        return points;
    };
}

function ClickHandler(k, activeZone, dataStorage, settings) {
    this.listen = function (
        cbPanelScoreUpdate,
        cbAddChild,
        cbVisualEffectScattering,
        cbVisualEffectFlySymbolUp,
        cbBottomPanel,
        cbBottomPanelText,
        cbCloseButton
    ) {
        const tapsAllowed = 1;
        let taps = 0;
        const flySymbolOption = {
            sing: '01',
            positionX: [110, 220],
            positionY: 150,
        };
        const vibrationPattern = settings.vibrationPattern;
        const growPoints = [
            dataStorage.growPoints.s,
            dataStorage.growPoints.m,
            dataStorage.growPoints.l,
            dataStorage.limit,
        ];

        window.addEventListener('touchstart', (e) => (taps = e.touches.length));

        activeZone.onClick(() => {
            if (dataStorage.countClick < dataStorage.limit) {
                if (!k.isTouchscreen()) this._processing();

                if (k.isTouchscreen() && taps === tapsAllowed) this._processing();

                if (growPoints.includes(dataStorage.countClick)) navigator.vibrate(vibrationPattern);

                switch (dataStorage.countClick) {
                    case dataStorage.growPoints.s:
                        cbAddChild(
                            activeZone,
                            settings.scales.default,
                            settings.positions.s.x,
                            settings.positions.s.y,
                            'mushroomS'
                        );
                        break;
                    case dataStorage.growPoints.m:
                        cbAddChild(
                            activeZone,
                            settings.scales.default,
                            settings.positions.m.x,
                            settings.positions.m.y,
                            'mushroomM'
                        );
                        break;
                    case dataStorage.growPoints.l:
                        cbAddChild(
                            activeZone,
                            settings.scales.default,
                            settings.positions.l.x,
                            settings.positions.l.y,
                            'mushroomL'
                        );
                        break;
                    case dataStorage.limit:
                        cbAddChild(
                            activeZone,
                            settings.scales.xl,
                            settings.positions.xl.x,
                            settings.positions.xl.y,
                            'mushroomL'
                        );
                        cbBottomPanel();
                        cbBottomPanelText();
                        cbCloseButton(() => {
                            dataStorage.countClick = 0;
                            cbPanelScoreUpdate(dataStorage.countClick);
                            cbAddChild(
                                activeZone,
                                settings.scales.default,
                                settings.positions.xs.x,
                                settings.positions.xs.y,
                                'mushroomXS'
                            );
                        });
                        break;
                }
            }
        });

        this._processing = function () {
            ++dataStorage.countClick;
            cbPanelScoreUpdate(dataStorage.countClick);
            cbVisualEffectScattering(k.mousePos());
            cbVisualEffectFlySymbolUp(
                flySymbolOption.sing,
                k.vec2(k.randi(flySymbolOption.positionX[0], flySymbolOption.positionX[1]), flySymbolOption.positionY)
            );
        };
    };
}

function Manager(k, settings) {
    this.dataStorageInit = function () {
        return {
            countClick: 0,
            limit: settings.clickLimit,
            growPoints: {
                s: 25,
                m: 50,
                l: 75,
            },
        };
    };
}

function UserInterface(k, settings) {
    this._panelScore = null;
    this._panelNotification = null;
    this._panelNotificationBorder = null;

    this.topPanel = function () {
        const options = {
            width: 336,
            height: 64,
            x: 12,
            y: 12,
        };

        this._border(options.width, options.height, options.x, options.y);
        const panel = this._panel(options.width, options.height, options.x, options.y);
        panel.add([k.text(`/${settings.clickLimit}`, { size: 60, font: settings.font }), k.pos(options.x + 135, 0)]);
        this._panelScore = panel;
    };

    this.panelScoreUpdate = (value) => {
        let posX = 100;
        if (value >= 10) posX = value >= 10 && value < settings.clickLimit ? 60 : 20;
        this._panelScore.children.splice(1);
        this._panelScore.add([k.text(`${value}`, { size: 60, font: settings.font }), k.pos(posX, 0)]);
    };

    this.bottomPanel = () => {
        const options = {
            width: 336,
            height: 128,
            x: 12,
            y: 500,
        };

        this._panelNotificationBorder = this._border(options.width, options.height, options.x, options.y);
        this._panelNotification = this._panel(options.width, options.height, options.x, options.y);
    };

    this.bottomPanelText = () => {
        const text = settings.predictions[Math.floor(Math.random() * settings.predictions.length)];
        this._panelNotification.add([
            k.text(`${text}`, { size: 21, font: settings.font, width: 340, align: 'center' }),
            k.pos(0, 35),
        ]);
    };

    this.closeButton = (cbRestart) => {
        const btn = k.add([
            k.sprite('buttonClose'),
            k.pos(this._panelNotification.pos.x + 300, this._panelNotification.pos.y - 10),
            k.scale(1.5),
            k.layer('ui'),
            k.z(10),
            k.anchor('center'),
            k.area(),
        ]);
        const circle = k.add([k.circle(26, { fill: true }), k.pos(btn.pos.x, btn.pos.y), k.layer('ui')]);

        btn.onClick(() => {
            [this._panelNotification, this._panelNotification, this._panelNotificationBorder, circle, btn].forEach(
                (item) => item.destroy()
            );
            cbRestart();
        });
    };

    this._border = function (width, height, x, y) {
        return k.add([k.rect(width, height, { fill: false }), k.outline(10, k.WHITE), k.pos(x, y)]);
    };

    this._panel = function (width, height, x, y) {
        return k.add([k.sprite('backgroundText', { tiled: true, width: width, height: height }), k.pos(x, y)]);
    };
}

function VisualEffect(k, settings) {
    this.scattering = function (position) {
        const directions = [k.LEFT, k.UP, k.RIGHT, k.DOWN, k.vec2(1, 1), k.vec2(-1, -1), k.vec2(1, -1), k.vec2(-1, 1)];
        directions.forEach((dir) => {
            k.add([
                k.pos(position),
                k.sprite('star'),
                k.scale(0.5),
                k.anchor('center'),
                k.opacity(0.7),
                k.lifespan(0.4, { fade: 0.2 }),
                k.move(dir, k.rand(230, 330)),
            ]);
        });
    };

    this.flySymbolUp = function (sing, position) {
        k.add([
            k.pos(position),
            k.text(`${sing}`, { size: 30, font: settings.font }),
            k.opacity(1),
            k.lifespan(0.4, { fade: 0.2 }),
            k.move(k.UP, k.rand(100, 200)),
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
        crisp: true,
        texFilter: 'nearest',
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
    const visualEffect = new VisualEffect(k, settings);
    const clickHandler = new ClickHandler(k, area, dataStorage, settings);
    userInterface.topPanel();
    userInterface.panelScoreUpdate(0);
    clickHandler.listen(
        userInterface.panelScoreUpdate,
        scene.addChild,
        visualEffect.scattering,
        visualEffect.flySymbolUp,
        userInterface.bottomPanel,
        userInterface.bottomPanelText,
        userInterface.closeButton
    );

    /*
    area.onClick(() => {
        zzfx('1.8,0,543,.01,.06,.16,0,2.6,0,30,0,0,0,0,0,0,0,.73,.04,0,550');
       
    });
    */
})(settings);
