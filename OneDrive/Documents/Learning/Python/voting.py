class VotingPoll:
    def __init__(self):
        self.candidate_A = 0
        self.candidate_B = 0
        self.candidate_C = 0
    
    def vote_candidate_A(self):
        self.candidate_A += 1

    def vote_candidate_B(self):
        self.candidate_B += 1

    def vote_candidate_C(self):
        self.candidate_C += 1
    
Voting_Poll = VotingPoll()

Voting_Poll.vote_candidate_A()
Voting_Poll.vote_candidate_A()
Voting_Poll.vote_candidate_A()

Voting_Poll.vote_candidate_B()
Voting_Poll.vote_candidate_B()

Voting_Poll.vote_candidate_C()

print("Votes for Candidate A:", Voting_Poll.candidate_A)  # Output: 3
print("Votes for Candidate B:", Voting_Poll.candidate_B)  # Output: 2
print("Votes for Candidate C:", Voting_Poll.candidate_C)  # Output:Personselfselfprint