import Foundation

struct StoreWidget {
    let title: String

    func summary() -> String {
        return "Storefront: \(title)"
    }
}
