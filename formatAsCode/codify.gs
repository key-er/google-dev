function onOpen(e) {
    DocumentApp.getUi().createAddonMenu()
        .addItem('Start', 'showSidebar')
        .addToUi();
}

function onInstall(e) {
    onOpen(e);
}


function showSidebar() {
    var ui = HtmlService.createHtmlOutputFromFile('sidebar')
        .setTitle('Format As Code');
    DocumentApp.getUi().showSidebar(ui);
}


function getSelectedText() {
    var selection = DocumentApp.getActiveDocument().getSelection();
    if (selection) {
        var text = [];
        var elements = selection.getSelectedElements();
        for (var i = 0; i < elements.length; ++i) {
            if (elements[i].isPartial()) {
                var element = elements[i].getElement().asText();
                var startIndex = elements[i].getStartOffset();
                var endIndex = elements[i].getEndOffsetInclusive();
                text.push(element.getText().substring(startIndex, endIndex + 1));

            } else {
                var element = elements[i].getElement();
                // Only translate elements that can be edited as text; skip images and
                // other non-text elements.
                if (element.editAsText) {
                    var elementText = element.asText().getText();
                    // This check is necessary to exclude images, which return a blank
                    // text element.
                    if (elementText) {
                        text.push(elementText);
                    }
                }
            }
        }
        if (!text.length) {
            throw new Error('Please select some text.');
        }
        return text;
    } else {
        throw new Error('Please select some text.');
    }
}



function getOrigTextAndFormattedText() {

    var text = getSelectedText().join('\n');
    return {
        text: text,
        translation: text
    };
}

function insertText(newText, font) {
    var selection = DocumentApp.getActiveDocument().getSelection();


    if (selection) {

        var replaced = false;
        var elements = selection.getSelectedElements();
        if (elements.length === 1 && elements[0].getElement().getType() ===
            DocumentApp.ElementType.INLINE_IMAGE) {
            throw new Error('Can\'t insert text into an image.');
        }
        for (var i = 0; i < elements.length; ++i) {
            if (elements[i].isPartial()) {
                var element = elements[i].getElement().asText();
                var startIndex = elements[i].getStartOffset();
                var endIndex = elements[i].getEndOffsetInclusive();
                element.deleteText(startIndex, endIndex);
                if (!replaced) {
                    element.insertText(startIndex, newText).setFontSize(startIndex, endIndex, Number(font.size))
                        .setFontFamily(startIndex, endIndex, font.family)
                        .setForegroundColor(startIndex, endIndex, font.color)
                    replaced = true;
                } else {
                    // This block handles a selection that ends with a partial element. We
                    // want to copy this partial text to the previous element so we don't
                    // have a line-break before the last partial.
                    var parent = element.getParent();
                    var remainingText = element.getText().substring(endIndex + 1);
                    parent.getPreviousSibling().asText().appendText(remainingText);
                    // We cannot remove the last paragraph of a doc. If this is the case,
                    // just remove the text within the last paragraph instead.
                    if (parent.getNextSibling()) {
                        parent.removeFromParent();
                    } else {
                        element.removeFromParent();
                    }
                }
            } else {
                var element = elements[i].getElement();
                if (!replaced && element.editAsText) {
                    // Only translate elements that can be edited as text, removing other
                    // elements.
                    element.clear();
                    element.asText().setText(newText)
                    replaced = true;
                } else {
                    // We cannot remove the last paragraph of a doc. If this is the case,
                    // just clear the element.
                    if (element.getNextSibling()) {
                        element.removeFromParent();
                    } else {
                        element.clear();
                    }
                }
            }
        }
    } else {
        var cursor = DocumentApp.getActiveDocument().getCursor();
        var surroundingText = cursor.getSurroundingText().getText();
        var surroundingTextOffset = cursor.getSurroundingTextOffset();

        // If the cursor follows or preceds a non-space character, insert a space
        // between the character and the translation. Otherwise, just insert the
        // translation.
        if (surroundingTextOffset > 0) {
            if (surroundingText.charAt(surroundingTextOffset - 1) != ' ') {
                newText = ' ' + newText;
            }
        }
        if (surroundingTextOffset < surroundingText.length) {
            if (surroundingText.charAt(surroundingTextOffset) != ' ') {
                newText += ' ';
            }
        }
        //cursor.insertText(newText)
        cursor.insertText(startIndex, newText).setFontSize(startIndex, endIndex, Number(font.size))
                        .setFontFamily(startIndex, endIndex, font.family)
                        .setForegroundColor(startIndex, endIndex, font.color)
    }
}
