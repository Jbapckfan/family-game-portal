import Foundation
import Combine

// Simplified engine concept for Syntax Siege

class Enemy: ObservableObject {
    let id = UUID()
    let letter: Character
    @Published var distance: CGFloat = 100.0 // Distance from core
    @Published var hp: Int = 1
    
    init(letter: Character) {
        self.letter = letter
    }
    
    func move(deltaTime: TimeInterval) {
        distance -= 10.0 * deltaTime // Speed constant
    }
}

class SyntaxSiegeViewModel: ObservableObject {
    @Published var enemies: [Enemy] = []
    @Published var hand: [Character] = []
    @Published var coreHP: Int = 100
    @Published var score: Int = 0
    
    private var timer: AnyCancellable?
    private let dictionary: Set<String> // Load from bundled plist/json
    
    init(dictionary: Set<String>) {
        self.dictionary = dictionary
        startGameLoop()
    }
    
    func startGameLoop() {
        timer = Timer.publish(every: 0.1, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                self?.update(dt: 0.1)
            }
    }
    
    func update(dt: TimeInterval) {
        // Move enemies
        for enemy in enemies {
            enemy.move(deltaTime: dt)
            if enemy.distance <= 0 {
                coreHP -= 10
                removeEnemy(enemy.id)
            }
        }
        
        // Spawn new enemies randomly
        if Double.random(in: 0...1) < 0.05 {
            let randomChar = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".randomElement()!
            enemies.append(Enemy(letter: randomChar))
        }
        
        // Handle letter expiration from hand (simple timestamp check in real impl)
    }
    
    func submitWord(_ word: String) {
        guard word.count >= 2 else { return }
        guard dictionary.contains(word.uppercased()) else { 
            // Penalty for invalid word?
            return 
        }
        
        // Check if letters exist in hand
        var tempHand = hand
        var valid = true
        for char in word.uppercased() {
            if let index = tempHand.firstIndex(of: char) {
                tempHand.remove(at: index)
            } else {
                valid = false
                break
            }
        }
        
        if valid {
            hand = tempHand
            score += word.count * 10
            // Damage nearest enemies or specific types based on word properties
            dealDamage(amount: word.count)
        }
    }
    
    func dealDamage(amount: Int) {
        // Logic to reduce enemy HP or push them back
        for i in 0..<min(amount, enemies.count) {
            enemies[i].hp -= 1
            if enemies[i].hp <= 0 {
                removeEnemy(enemies[i].id)
            }
        }
    }
    
    func removeEnemy(_ id: UUID) {
        enemies.removeAll { $0.id == id }
    }
}