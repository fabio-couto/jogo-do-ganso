(function ($) {

    function SetKeyStatus(keyCode, isPressed) {
        switch (keyCode) {
            case 37:
                PressedKeys.Left = isPressed;
                break;
            case 38:
                PressedKeys.Up = isPressed;
                break;
            case 39:
                PressedKeys.Right = isPressed;
                break;
        }
    };

    $(document)
        .keydown(function (event) { SetKeyStatus(event.keyCode, true); })
        .keyup(function (event) { SetKeyStatus(event.keyCode, false); });

    window.PressedKeys = {
        Left: false,
        Right: false,
        Up: false
    };

})(jQuery);