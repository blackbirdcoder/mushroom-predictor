import kaplay from 'kaplay';
import { zzfx } from '/public/libs/zzfx.micro.js';

const settings = {
    sprites: ['backgroundImage', 'backgroundText', 'buttonClose', 'mushroomFinal', 'mushroomStart', 'star'],
    font: 'silkscreen',
    scene: {
        width: 360,
        height: 640,
    },
};

function Resource(k, spritesNames, fontName) {
    this.loader = function () {
        spritesNames.forEach((item) => {
            k.loadSprite(item, `./sprites/${item}.png`);
        });

        k.loadFont(fontName, `./fonts/${fontName}.woff2`);
    };
}

(function main(settings) {
    const k = kaplay({
        width: settings.scene.width,
        height: settings.scene.height,
        stretch: true,
        letterbox: true,
    });
    const resource = new Resource(k, settings.sprites, settings.font);
    resource.loader();

    k.add([k.pos(120, 80), k.sprite('backgroundImage'), k.scale(1)]);

    k.onClick(() => {
        // zzfx('1.8,0,543,.01,.06,.16,0,2.6,0,30,0,0,0,0,0,0,0,.73,.04,0,550');
        k.addKaboom(k.mousePos());
    });
})(settings);
