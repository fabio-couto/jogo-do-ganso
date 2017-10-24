(function ($) {

    function load(names, callback) {
        var name,
            imagesToLoad = names.length,
            result = {};

        for (var n = 0; n < names.length; n++) {
            name = names[n];

            result[name] = new Image();
            result[name].onload = function () { if (--imagesToLoad == 0) callback(result); };
            result[name].onerror = function () { alert('Erro no carregamento da imagem "' + this.name + '".') };
            result[name].name = name;
            result[name].src = "images/" + names[n] + ".png";
        }
    };

    window.LoadImages = load;

})(jQuery);