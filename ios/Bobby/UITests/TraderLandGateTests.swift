import XCTest

final class TraderLandGateTests: XCTestCase {
    private func tapTile(_ app: XCUIApplication, col: Int, row: Int) {
        // The map's gesture surface receives physical taps above the tile buttons.
        app.buttons["land-tile-\(col)-\(row)"].coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        XCTAssertEqual(app.staticTexts["land-draft-coordinate"].label, "\(col + 1) / \(row + 1)")
    }

    func testPreviewMoveCancelCollisionUndoAndPersistence() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-trader-land-gate", "-AppleLanguages", "(en)"]
        app.launch()
        XCTAssertTrue(app.buttons["How to play"].waitForExistence(timeout: 10))
        app.buttons["How to play"].tap()
        app.buttons["Restore"].tap()
        let status = app.staticTexts["land-fixed-status"]
        XCTAssertTrue(status.waitForExistence(timeout: 5))
        XCTAssertEqual(status.label, "FOCUS 1/2 · 8 PLACED")
        XCTAssertTrue(app.descendants(matching: .any)["path-path-a-connectors-SE"].exists)
        XCTAssertTrue(app.descendants(matching: .any)["path-path-b-connectors-NW"].exists)

        app.buttons["blueprint-crypto_bay_data_dock"].tap()
        app.buttons["land-build-or-move"].tap()
        XCTAssertTrue(app.buttons["land-confirm"].isEnabled)
        app.buttons["Cancel placement"].tap()
        XCTAssertEqual(status.label, "FOCUS 1/2 · 8 PLACED")

        app.buttons["land-build-or-move"].tap()
        tapTile(app, col: 3, row: 3)
        XCTAssertFalse(app.buttons["land-confirm"].isEnabled)
        tapTile(app, col: 0, row: 0)
        XCTAssertFalse(app.buttons["land-confirm"].isEnabled)
        tapTile(app, col: 2, row: 6)
        app.buttons["land-confirm"].tap()
        XCTAssertEqual(status.label, "FOCUS 1/2 · 9 PLACED")

        app.buttons["land-build-or-move"].tap()
        tapTile(app, col: 2, row: 5)
        app.buttons["land-confirm"].tap()
        XCTAssertEqual(status.label, "FOCUS 1/2 · 9 PLACED")
        app.buttons["land-undo"].tap()
        XCTAssertEqual(status.label, "FOCUS 1/2 · 9 PLACED")

        app.terminate(); app.launch()
        XCTAssertTrue(status.waitForExistence(timeout: 5))
        XCTAssertEqual(status.label, "FOCUS 1/2 · 9 PLACED")
        app.buttons["blueprint-crypto_bay_candle_tower"].tap()
        app.buttons["land-build-or-move"].tap()
        app.buttons["land-rotate"].tap()
        tapTile(app, col: 6, row: 6)
        XCTAssertFalse(app.buttons["land-confirm"].isEnabled)
        app.buttons["Cancel placement"].tap()
        app.buttons["How to play"].tap()
        app.buttons["Restore"].tap()
        XCTAssertEqual(status.label, "FOCUS 1/2 · 8 PLACED")
    }
}
